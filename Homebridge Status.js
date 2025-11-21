// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: home;

// === CONFIGURATION ===
const CONFIG = {
  // Homebridge server URL must include protocol (e.g., 'http://')
  hbServiceMachineBaseUrl: "<INSERT HOSTNAME AND PORT>",
  userName: "<INSERT HOMEBRIDGE USERNAME>",
  password: "<INSERT HOMEBRIDGE PASSWORD>",
  requestTimeoutInterval: 15, // in seconds

  // Homebridge logo URL
  logoUrl:
    "https://raw.githubusercontent.com/homebridge/branding/latest/logos/homebridge-silhouette-round-white.png",

  // Local file name for cached logo file
  hbLogoFileName: `${Device.model()}_hbLogo.png`,
};

// === GLOBAL VARIABLES ===
// Initialize variables
let token;
let fileManager;
let headerFont, infoFont, chartAxisFont, updatedAtFont;

// Format date in MM-dd-yyyy HH:mm:ss (for last refreshed timestamp)
const timeFormatter = new DateFormatter();
timeFormatter.dateFormat = "MM-dd-yyyy HH:mm:ss";

// === STYLES ===
const STYLES = {
  // Define text colors, icon fills, and background gradient
  colors: {
    text: "#FFFFFF",
    chartFill: "#FFFFFF",
    statusGood: "#00FF00",
    statusBad: "#FF3B30",
    statusUnknown: "#FFD60A",
    gradientTop: "#250B3B",
    gradientBottom: "#320D47",
  },

	// Define font size
  fonts: {
    title: { size: 12 },
    info: { size: 10 },
    chartAxis: { size: 7 },
    updatedAt: { size: 7 },
  },

  // Define status icons
  icons: {
    statusGood: "checkmark.circle.fill",
    statusBad: "exclamationmark.triangle.fill",
    statusUnknown: "questionmark.circle.fill",
  },

  // Define special characters
  specialCharacters: {
    bulletPointIcon: "▫️",
    decimal: ".",
  },

  // Define spacer sizing (in pixels)
  spacers: {
    beforeStatusColumn: 8,
    betweenStatusColumns: 5,
    afterSecondColumn: 0,
    verticalInfo: 5,
  },

  // Define line width and height for graph
  lines: {
    maxLineWidth: 300,
    normalLineHeight: 35,
  },
};

// === HELPERS ===
// Apply text color
const setTextColor = (text, color = STYLES.colors.text) =>
  (text.textColor = new Color(color));

// Convert number to rounded string
const getAsRoundedString = (value, decimal) =>
  formatNumber(Number(value), decimal);

// Round number to specified number of decimal places
const formatNumber = (value, decimal = 1) =>
  +value.toFixed(decimal)
    .toString()
    .replace(".", STYLES.specialCharacters.decimal);

// Format seconds into string with largest appropriate unit (d/h/m/s)
const formatSeconds = (value) => {
  if (value > 864000) return `${getAsRoundedString(value / 86400, 0)}d`;
  if (value > 86400) return `${getAsRoundedString(value / 86400, 1)}d`;
  if (value > 3600) return `${getAsRoundedString(value / 3600, 1)}h`;
  if (value > 60) return `${getAsRoundedString(value / 60, 1)}m`;
  return `${getAsRoundedString(value, 1)}s`;
};

// Convert Celsius temperature to Fahrenheit string (rounded to tenths)
const getTemperatureString = (celsius) =>
  `${getAsRoundedString((celsius * 9) / 5 + 32, 1)}°F`;

// === DATA MODELS ===
// Graph data
class LineChart {
  constructor(width, height, values) {
    this.context = new DrawContext();
    this.context.size = new Size(width, height);
    this.values = values || [0];
  }

  // Generate a smooth path for the line chart based on values
  _path() {
    const values = this.values;
    const width = this.context.size.width;
    const height = this.context.size.height;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const r = max === min ? 1 : max - min;
    const step = width / Math.max(1, values.length - 1);

    const path = new Path();
    path.move(new Point(0, height));

    values.forEach((val, i) => {
      const y = height - ((val - min) / r) * height;
      const x = i * step;

      if (i === 0) {
        path.addLine(new Point(x, y));
      } else {
        const prevX = (i - 1) * step;
        const prevY = height - ((values[i - 1] - min) / r) * height;
        const m = new Point((prevX + x) / 2, (prevY + y) / 2);

        path.addQuadCurve(m, new Point((m.x + prevX) / 2, prevY));
        path.addQuadCurve(new Point(x, y), new Point((m.x + x) / 2, y));
      }
    });

    path.addLine(new Point(width, height));
    path.closeSubpath();
    return path;
  }

  // Render the chart as an image
  getImage(colorHex = STYLES.colors.chartFill) {
    const path = this._path();
    this.context.opaque = false;
    this.context.setFillColor(new Color(colorHex));
    this.context.addPath(path);
    this.context.fillPath();
    return this.context.getImage();
  }
}

// Aggregate statuses
class HomeBridgeStatus {
  async initialize() {
    // Fetch data in parallel from endpoints
    const [status, homebridgeVersion, plugins, nodeJs, cpu, ram, uptime] =
      await Promise.all([
        fetchData(api("/api/status/homebridge")),
        fetchData(api("/api/status/homebridge-version")),
        fetchData(api("/api/plugins")),
        fetchData(api("/api/status/nodejs")),
        fetchData(api("/api/status/cpu")),
        fetchData(api("/api/status/ram")),
        fetchData(api("/api/status/uptime")),
      ]);

    // Fallback/hardcoded status
    this.overallStatus = "up";

    // Determine statuses from endpoints
    this.hbUpToDate = homebridgeVersion
      ? !homebridgeVersion.updateAvailable
      : undefined;
    this.pluginsUpToDate = plugins
      ? !plugins.some((p) => p.updateAvailable)
      : undefined;
    this.nodeJsUpToDate = nodeJs ? !nodeJs.updateAvailable : undefined;

    this.cpuData = cpu;
    this.ramData = ram;

    // Calculate and format uptimes for system and UI
    if (uptime) {
      const system = uptime.time?.uptime ?? uptime.uptime ?? "unknown";
      const ui =
        uptime.time?.uiUptime ??
        uptime.time?.processUptime ??
        uptime.processUptime ??
        "unknown";

      this.uptimesArray = [
        system !== "unknown" ? formatSeconds(system) : "unknown",
        ui !== "unknown" ? formatSeconds(ui) : "unknown",
      ];
    } else {
      this.uptimesArray = ["unknown", "unknown"];
    }

    return this;
  }
}

// === NETWORK & API CLIENT ===
// Construct full API URL
const api = (path) => CONFIG.hbServiceMachineBaseUrl.replace(/\/$/, "") + path;

const tryLoadJSON = async (request) => {
  try {
    return await request.loadJSON();
  } catch {
    return undefined;
  }
};

// Request auth token
const getAuthToken = async () => {
  const headers = {
    accept: "*/*",
    "Content-Type": "application/json",
  };

  const login = new Request(api("/api/auth/login"));
  login.method = "POST";
  login.timeoutInterval = CONFIG.requestTimeoutInterval;
  login.headers = headers;
  login.body = JSON.stringify({
    username: CONFIG.userName,
    password: CONFIG.password,
  });

  return (
    (await tryLoadJSON(login))?.access_token ||
    "Unable to retrieve data."
  );
};

// Fetch data
const fetchData = async (url) => {
  const request = new Request(url);
  request.method = "GET";
  request.timeoutInterval = CONFIG.requestTimeoutInterval;
  request.headers = {
    accept: "*/*",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  return await tryLoadJSON(request);
};

// Get local path for a given filename and create directory if missing
const getFilePath = (fileName) => {
  const dir = fileManager.joinPath(
    fileManager.documentsDirectory(),
    "Home Bridge Status"
  );
  if (!fileManager.fileExists(dir)) fileManager.createDirectory(dir);
  return fileManager.joinPath(dir, fileName);
};

// Fetch image
const loadImage = async (url) => {
  const req = new Request(url);
  req.timeoutInterval = CONFIG.requestTimeoutInterval;
  return await req.loadImage();
};

// Get Homebridge logo from cache, download if missing
const getHbLogoImage = async () => {
  const path = getFilePath(CONFIG.hbLogoFileName);

  if (fileManager.fileExists(path)) {
    if (!(await fileManager.isFileDownloaded(path)))
      await fileManager.downloadFileFromiCloud(path);

    return fileManager.readImage(path);
  }

  const img = await loadImage(CONFIG.logoUrl);
  fileManager.writeImage(path, img);
  return img;
};

// === UI COMPONENTS ===
// Predefine dark purple gradient
const darkPurpleGradientBackground = (() => {
  const gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color(STYLES.colors.gradientTop),
    new Color(STYLES.colors.gradientBottom),
  ];
  return gradient;
})();

// Apply background gradient
const handleBackground = (widget) =>
  (widget.backgroundGradient = darkPurpleGradientBackground);

// Initialize fonts
const initializeFonts = () => {
  headerFont = Font.boldMonospacedSystemFont(STYLES.fonts.title.size);
  infoFont = Font.systemFont(STYLES.fonts.info.size);
  chartAxisFont = Font.systemFont(STYLES.fonts.chartAxis.size);
  updatedAtFont = Font.systemFont(STYLES.fonts.updatedAt.size);
};

// Add logo and title
const initializeLogoAndHeader = async (stack) => {
  stack.size = new Size(
    STYLES.lines.maxLineWidth,
    STYLES.lines.normalLineHeight
  );

  const logo = await getHbLogoImage();
  const img = stack.addImage(logo);
  img.imageSize = new Size(40, 30);

  const title = addText(stack, " Homebridge ", headerFont);
  title.size = new Size(60, STYLES.lines.normalLineHeight);
};

// Add a text element to a stack with optional font and color
const addText = (stack, txt, font, color) => {
  const t = stack.addText(txt);
  if (font) t.font = font;
  setTextColor(t, color);
  return t;
};

// Add an SF Symbol icon to a stack
const addIcon = (stack, name, colorHex) => {
  const icon = stack.addImage(SFSymbol.named(name).image);
  icon.resizable = true;
  icon.imageSize = new Size(13, 13);
  icon.tintColor = new Color(colorHex);
};

// Add a status icon (good/bad/unknown) to a stack
const addStatusIcon = (stack, status) => {
  let iconName, colorHex;

  if (status === undefined) {
    iconName = STYLES.icons.statusUnknown;
    colorHex = STYLES.colors.statusUnknown;
  } else if (status) {
    iconName = STYLES.icons.statusGood;
    colorHex = STYLES.colors.statusGood;
  } else {
    iconName = STYLES.icons.statusBad;
    colorHex = STYLES.colors.statusBad;
  }

  addIcon(stack, iconName, colorHex);
};

// Add a status line with icon and text
const addStatusInfo = (stack, status, text) => {
  const s = stack.addStack();
  addStatusIcon(s, status);
  s.addSpacer(2);

  const t = s.addText(text);
  t.font = Font.semiboldMonospacedSystemFont(STYLES.fonts.info.size);
  setTextColor(t);
};

// Build status section in header as 2 columns
const headerStatus = (stack, homebridgeStatus) => {
  stack.addSpacer(STYLES.spacers.beforeStatusColumn);

  const statusInfo = stack.addStack();

  // Column 1: Overall status and Plugins status
  const statusColumn1 = statusInfo.addStack();
  statusColumn1.layoutVertically();

  addStatusInfo(statusColumn1, homebridgeStatus.overallStatus, "Running");
  statusColumn1.addSpacer(STYLES.spacers.verticalInfo);
  addStatusInfo(
    statusColumn1,
    homebridgeStatus.pluginsUpToDate,
    "Plugins UTD"
  );

  statusInfo.addSpacer(STYLES.spacers.betweenStatusColumns);

  // Column 2: Homebridge UI status and Node.js status
  const statusColumn2 = statusInfo.addStack();
  statusColumn2.layoutVertically();

  addStatusInfo(statusColumn2, homebridgeStatus.hbUpToDate, "UI UTD");
  statusColumn2.addSpacer(STYLES.spacers.verticalInfo);
  addStatusInfo(statusColumn2, homebridgeStatus.nodeJsUpToDate, "Node.js UTD");

  stack.addSpacer(STYLES.spacers.afterSecondColumn);
};

// Calculate percentage of RAM used
const getUsedRamString = (ram) =>
  ram
    ? getAsRoundedString(
        100 - (100 * ram.mem.available) / ram.mem.total,
        2
      )
    : "unknown";

// Add line chart to widget with axis labels
const addChartToWidget = (col, data) => {
  if (!data) return;

  const row = col.addStack();
  row.addSpacer(5);

  const yLabels = row.addStack();
  yLabels.layoutVertically();

  const maxV = Math.max(...data);
  const minV = Math.min(...data);

  addText(yLabels, `${getAsRoundedString(maxV, 2)}%`, chartAxisFont);
  yLabels.addSpacer(6);
  addText(yLabels, `${getAsRoundedString(minV, 2)}%`, chartAxisFont);
  yLabels.addSpacer(6);

  row.addSpacer(2);

  const chartImage = new LineChart(500, 100, data).getImage();
  const vChart = row.addStack();
  vChart.layoutVertically();

  vChart.addImage(chartImage).imageSize = new Size(100, 25);

  const xAxis = vChart.addStack();
  xAxis.size = new Size(100, 10);

  addText(xAxis, "t-10m", chartAxisFont);
  xAxis.addSpacer(75);
  addText(xAxis, "t", chartAxisFont);
};

// Display error and last fresh time if service is unreachable
const addNotAvailableInfos = (widget, now) => {
  const text = widget.addText(
    "❌ Homebridge service is unreachable!"
  );
  text.font = infoFont;
  setTextColor(text);

  widget.addSpacer(15);

  const last = widget.addText(
    `Last refreshed: ${timeFormatter.string(now)}`
  );
  last.font = updatedAtFont;
  setTextColor(last);
  last.centerAlignText();
};

// === WIDGET ASSEMBLY ===
// Assemble header, status panels, charts, uptimes, and footer timestamp
const buildFullWidget = async (widget, homebridgeStatus, now) => {
  widget.addSpacer(10);

  const titleStack = widget.addStack();
  await initializeLogoAndHeader(titleStack);
  headerStatus(titleStack, homebridgeStatus);

  widget.addSpacer(10);

  if (!homebridgeStatus.cpuData || !homebridgeStatus.ramData) {
    addNotAvailableInfos(widget, now);
    return;
  }

  const mainStack = widget.addStack();
  mainStack.size = new Size(STYLES.lines.maxLineWidth, 77);
  mainStack.addSpacer(4);

  // CPU column
  const cpuColumn = mainStack.addStack();
  cpuColumn.layoutVertically();

  addText(
    cpuColumn,
    `CPU Load: ${getAsRoundedString(
      homebridgeStatus.cpuData.currentLoad,
      1
    )}%`,
    infoFont
  );

  addChartToWidget(cpuColumn, homebridgeStatus.cpuData.cpuLoadHistory);

  cpuColumn.addSpacer(7);

  const tempStr =
    homebridgeStatus.cpuData?.cpuTemperature?.main
      ? getTemperatureString(
          homebridgeStatus.cpuData.cpuTemperature.main
        )
      : null;

  if (tempStr) {
    const t = addText(cpuColumn, `CPU Temp: ${tempStr}`, infoFont);
    t.size = new Size(150, 30);
    setTextColor(t);
  }

  mainStack.addSpacer(11);

  // RAM column
  const ramColumn = mainStack.addStack();
  ramColumn.layoutVertically();

  addText(
    ramColumn,
    `RAM Usage: ${getUsedRamString(
      homebridgeStatus.ramData
    )}%`,
    infoFont
  );

  addChartToWidget(
    ramColumn,
    homebridgeStatus.ramData.memoryUsageHistory
  );

  ramColumn.addSpacer(7);

  // Uptime info
  if (homebridgeStatus.uptimesArray) {
    const upStack = ramColumn.addStack();
    const upColumn = upStack.addStack();

    addText(upColumn, "Uptimes: ", infoFont);

    const vals = upColumn.addStack();
    vals.layoutVertically();

    addText(
      vals,
      `${STYLES.specialCharacters.bulletPointIcon}Raspberry Pi: ${
        homebridgeStatus.uptimesArray[0]
      }`,
      infoFont
    );

    addText(
      vals,
      `${STYLES.specialCharacters.bulletPointIcon}UI-Service: ${
        homebridgeStatus.uptimesArray[1]
      }`,
      infoFont
    );
  }

  widget.addSpacer(10);

  const last = addText(
    widget,
    `Last refreshed: ${timeFormatter.string(now)}`,
    updatedAtFont
  );
  last.centerAlignText();
};

// === MAIN EXECUTION ===
// Initialize fonts, auth, fetch status, build widget
(async () => {
  const now = new Date();
  fileManager = FileManager.local();

  initializeFonts();

  token = await getAuthToken();

  const widget = new ListWidget();
  handleBackground(widget);

  const status = await new HomeBridgeStatus().initialize();
  await buildFullWidget(widget, status, now);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    widget.presentMedium();
  }

  Script.complete();
})();
