// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: home;

// === CONFIGURATION ===
const CONFIG = {
  homebridge: {
    // Homebridge server URL must include protocol (e.g., 'http://')
    url: "<INSERT HOSTNAME AND PORT>",
    username: "<INSERT HOMEBRIDGE USERNAME>",
    password: "<INSERT HOMEBRIDGE PASSWORD>",
    requestTimeoutMs: 15, // in seconds
  }, 
  // Homebridge logo URL
  assets: {
    logoUrl:
      "https://raw.githubusercontent.com/homebridge/branding/latest/logos/homebridge-silhouette-round-white.png",
  },
};

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
    title: Font.boldMonospacedSystemFont(12),
    text: Font.systemFont(10),
    chartAxis: Font.systemFont(7),
    updatedAt: Font.systemFont(7),
    status: Font.semiboldMonospacedSystemFont(10),
  }, 
  
  // Define status icons
  icons: {
    statusGood: "checkmark.circle.fill",
    statusBad: "exclamationmark.triangle.fill",
    statusUnknown: "questionmark.circle.fill",
  }, 
  
  // Define sizing (spacer sizing in pixels)
  sizes: {
    spacerBeforeStatusColumn: 8,
    spacerBetweenStatusColumns: 5,
    spacerForVerticalInfo: 5,
    temperatureText: new Size(150, 30),
  }, 
  
  // Define line width and height for graph
  lines: {
    maxLineWidth: 300,
    normalLineHeight: 35,
  },
};

// === HELPER FUNCTIONS ===
// Local file name for cached logo file
const hbLogoFileName = `${Device.model()}_hbLogo.png`;

// Format date in MM-dd-yyyy HH:mm:ss (for last refreshed timestamp)
const timeFormatter = new DateFormatter();
timeFormatter.dateFormat = "MM-dd-yyyy HH:mm:ss";

// Convert number to rounded string
const toRoundedString = (value, decimal) =>
  formatNumber(Number(value), decimal);

// Round number to specified number of decimal places
const formatNumber = (value, decimal = 1) => Number(value).toFixed(decimal);

// Format seconds into string with largest appropriate unit (d/h/m/s)
const formatSeconds = (value) => {
  if (value > 864000) return `${toRoundedString(value / 86400, 0)}d`;
  if (value > 86400) return `${toRoundedString(value / 86400, 1)}d`;
  if (value > 3600) return `${toRoundedString(value / 3600, 1)}h`;
  if (value > 60) return `${toRoundedString(value / 60, 1)}m`;
  return `${toRoundedString(value, 1)}s`;
};

// Convert Celsius temperature to Fahrenheit string (rounded to tenths)
const getTemperatureString = (celsius) =>
  `${toRoundedString((celsius * 9) / 5 + 32, 1)}°F`;

// === DATA MODELS ===
// Graph data
class LineChart {
  constructor(width, height, values) {
    this.context = new DrawContext();
    this.context.size = new Size(width, height);
    this.values = values || [0];
  } 
  
  // Generate a smooth path for the line chart based on values
  buildPath() {
    const values = this.values;
    const width = this.context.size.width;
    const height = this.context.size.height;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const r = max === min ? 1 : max - min;
    const length = values.length;
    const step = width / Math.max(1, length - 1);

    const path = new Path();
    path.move(new Point(0, height));

    values.forEach((value, i) => {
      const y = height - ((value - min) / r) * height;
      const x = i * step;
      path.addLine(new Point(x, y));
    });

    path.addLine(new Point(width, height));
    path.closeSubpath();
    return path;
  } 
  
  // Render the chart as an image
  getImage(colorHex = STYLES.colors.chartFill) {
    const path = this.buildPath();
    this.context.opaque = false;
    this.context.setFillColor(new Color(colorHex));
    this.context.addPath(path);
    this.context.fillPath();
    return this.context.getImage();
  }
}

// Aggregate statuses
class HomeBridgeStatus {
  async initialize(token) {
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
      
    // Overall status
    this.reachable = !!(cpu && ram);
    this.overallStatus = this.reachable ? "up" : undefined; 
    
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
const api = (path) => CONFIG.homebridge.url.replace(/\/$/, "") + path;

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
  login.timeoutInterval = CONFIG.homebridge.requestTimeoutMs;
  login.headers = headers;
  login.body = JSON.stringify({
    username: CONFIG.homebridge.username,
    password: CONFIG.homebridge.password,
  });

  return (await tryLoadJSON(login))?.access_token || "Unable to retrieve data.";
};

// Fetch data
const fetchData = async (url) => {
  const request = new Request(url, token);
  request.method = "GET";
  request.timeoutInterval = CONFIG.homebridge.requestTimeoutMs;
  request.headers = {
    accept: "*/*",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  return await tryLoadJSON(request);
};

// Get local path for a given filename and create directory if missing
const getFilePath = (fileManager, fileName) => {
  const folderPath = fileManager.joinPath(
    fileManager.documentsDirectory(),
    "Home Bridge Status"
  );
  if (!fileManager.fileExists(folderPath))
    fileManager.createDirectory(folderPath);
  return fileManager.joinPath(folderPath, fileName);
};

// Fetch image
const loadImage = async (url) => {
  const request = new Request(url);
  request.timeoutInterval = CONFIG.homebridge.requestTimeoutMs;
  return await request.loadImage();
};

// Get Homebridge logo from cache, download if missing
const getHbLogoImage = async (fileManager) => {
  const path = getFilePath(fileManager, hbLogoFileName);

  if (fileManager.fileExists(path)) {
    if (!(await fileManager.isFileDownloaded(path)))
      await fileManager.downloadFileFromiCloud(path);

    return fileManager.readImage(path);
  }

  const image = await loadImage(CONFIG.assets.logoUrl);
  fileManager.writeImage(path, image);
  return image;
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

// Add logo and title
const initializeLogoAndHeader = async (stack, fileManager) => {
  stack.size = new Size(
    STYLES.lines.maxLineWidth,
    STYLES.lines.normalLineHeight
  );

  const logo = await getHbLogoImage(fileManager);
  const addLogo = stack.addImage(logo);
  addLogo.imageSize = new Size(40, 30);

  const title = addText(stack, " Homebridge ", STYLES.fonts.title);
  title.size = new Size(60, STYLES.lines.normalLineHeight);
};

// Apply text color
const setTextColor = (text, color = STYLES.colors.text) =>
  (text.textColor = new Color(color));

// Add a text element to a stack with optional font and color
const addText = (stack, txt, font, color) => {
  const textElement = stack.addText(txt);
  if (font) textElement.font = font;
  setTextColor(textElement, color);
  return textElement;
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
const addStatusInfo = (stack, status, text, reachable = true) => {
  if (!reachable || status === undefined) return; // Skip rendering if unreachable

  const statusElement = stack.addStack();
  addStatusIcon(statusElement, status);
  statusElement.addSpacer(2);

  const textElement = statusElement.addText(text);
  textElement.font = STYLES.fonts.status;
  setTextColor(textElement);
};

// Build status section in header as 2 columns
const headerStatus = (stack, homebridgeStatus) => {
  // Determine if service is reachable
  const reachable = homebridgeStatus.reachable;

  stack.addSpacer(STYLES.sizes.spacerBeforeStatusColumn);

  const statusInfo = stack.addStack(); 
  
  // Column 1: Overall status and Plugins status
  const statusColumn1 = statusInfo.addStack();
  statusColumn1.layoutVertically();

  addStatusInfo(
    statusColumn1,
    homebridgeStatus.overallStatus,
    "Running",
    reachable
  );
  statusColumn1.addSpacer(STYLES.sizes.spacerForVerticalInfo);
  addStatusInfo(
    statusColumn1,
    homebridgeStatus.pluginsUpToDate,
    "Plugins UTD",
    reachable
  );

  statusInfo.addSpacer(STYLES.sizes.spacerBetweenStatusColumns); 
  
  // Column 2: Homebridge UI status and Node.js status
  const statusColumn2 = statusInfo.addStack();
  statusColumn2.layoutVertically();

  addStatusInfo(
    statusColumn2,
    homebridgeStatus.hbUpToDate,
    "UI UTD",
    reachable
  );
  statusColumn2.addSpacer(STYLES.sizes.spacerForVerticalInfo);
  addStatusInfo(
    statusColumn2,
    homebridgeStatus.nodeJsUpToDate,
    "Node.js UTD",
    reachable
  );
};

// Calculate percentage of RAM used
const getUsedRamString = (ram) =>
  ram
    ? toRoundedString(100 - (100 * ram.mem.available) / ram.mem.total, 2)
    : "unknown";

// Add line chart to widget with axis labels
const addChartToWidget = (column, data) => {
  if (!data) return;

  const row = column.addStack();
  row.addSpacer(5);

  const yLabels = row.addStack();
  yLabels.layoutVertically();

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);

  addText(yLabels, `${toRoundedString(maxValue, 2)}%`, STYLES.fonts.chartAxis);
  yLabels.addSpacer(6);
  addText(yLabels, `${toRoundedString(minValue, 2)}%`, STYLES.fonts.chartAxis);
  yLabels.addSpacer(6);

  row.addSpacer(2);

  const chartImage = new LineChart(500, 100, data).getImage();
  const vChart = row.addStack();
  vChart.layoutVertically();

  vChart.addImage(chartImage).imageSize = new Size(100, 25);

  const xAxis = vChart.addStack();
  xAxis.size = new Size(100, 10);

  addText(xAxis, "t-10m", STYLES.fonts.chartAxis);
  xAxis.addSpacer(75);
  addText(xAxis, "t", STYLES.fonts.chartAxis);
};

// Display error and last refresh time if service is unreachable
const addNotAvailableInfos = (widget, now) => {
  const text = addText(
    widget,
    "❌ Homebridge service is unreachable!",
    STYLES.fonts.text
  );
  text.centerAlignText();

  widget.addSpacer(15);

  const last = widget.addText(
    widget,
    `Last refreshed: ${timeFormatter.string(now)}`,
    STYLES.fonts.updatedAt
  );
};

// === WIDGET ASSEMBLY ===
// Assemble header, status panels, charts, uptimes, and footer timestamp
const buildFullWidget = async (widget, homebridgeStatus, now, fileManager) => {
  widget.addSpacer(10);

  const titleStack = widget.addStack();
  await initializeLogoAndHeader(titleStack, fileManager);
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
    `CPU Load: ${toRoundedString(homebridgeStatus.cpuData.currentLoad, 1)}%`,
    STYLES.fonts.text
  );

  addChartToWidget(cpuColumn, homebridgeStatus.cpuData.cpuLoadHistory);

  cpuColumn.addSpacer(7);

  const temperatureText = homebridgeStatus.cpuData?.cpuTemperature?.main
    ? getTemperatureString(homebridgeStatus.cpuData.cpuTemperature.main)
    : null;

  if (temperatureText) {
    const temperatureTextElement = addText(
      cpuColumn,
      `CPU Temp: ${temperatureText}`,
      STYLES.fonts.text
    );
    temperatureTextElement.size = STYLES.sizes.temperatureText;
    setTextColor(temperatureTextElement);
  }

  mainStack.addSpacer(11); 
  
  // RAM column
  const ramColumn = mainStack.addStack();
  ramColumn.layoutVertically();

  addText(
    ramColumn,
    `RAM Usage: ${getUsedRamString(homebridgeStatus.ramData)}%`,
    STYLES.fonts.text
  );

  addChartToWidget(ramColumn, homebridgeStatus.ramData.memoryUsageHistory);

  ramColumn.addSpacer(7); 
  
  // Uptime info
  if (homebridgeStatus.uptimesArray) {
    const upStack = ramColumn.addStack();
    const upColumn = upStack.addStack();

    addText(upColumn, "Uptimes: ", STYLES.fonts.text);

    const values = upColumn.addStack();
    values.layoutVertically();

    addText(
      values,
      `▫️ Raspberry Pi: ${homebridgeStatus.uptimesArray[0]}`,
      STYLES.fonts.text
    );

    addText(
      values,
      `▫️ UI-Service: ${homebridgeStatus.uptimesArray[1]}`,
      STYLES.fonts.text
    );
  }

  widget.addSpacer(10);

  const lastRefreshed = addText(
    widget,
    `Last refreshed: ${timeFormatter.string(now)}`,
    STYLES.fonts.updatedAt
  );
  lastRefreshed.centerAlignText();
};

// === MAIN EXECUTION ===
// Initialize fonts, auth, fetch status, build widget
(async () => {
  const now = new Date();
  const runtime = {
    fileManager: FileManager.local(),
    token: await getAuthToken(),
  };

  token = await getAuthToken();

  const widget = new ListWidget();
  handleBackground(widget);

  const status = await new HomeBridgeStatus().initialize(runtime.token);

  await buildFullWidget(widget, status, now, runtime.fileManager);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    widget.presentMedium();
  }

  Script.complete();
})();
