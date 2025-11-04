// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: home;

// === CONFIGURATION ===
const CONFIG = Object.freeze({
  // Homebridge server URL (must include protocol, e.g., 'http://')
  hbServiceMachineBaseUrl: "<INSERT HOSTNAME AND PORT>",
  userName: "<INSERT HOMEBRIDGE USERNAME>",
  password: "<INSERT HOMEBRIDGE PASSWORD>",
  requestTimeoutInterval: 15, // in seconds

  // Colors and icons
  chartColor: "#FFFFFF", // Default chart fill color
  fontColor: "#FFFFFF",  // Default text color
  
  // Status icons and colors
  icon_statusGood: "checkmark.circle.fill",
  icon_colorGood: "#00FF00",
  icon_statusBad: "exclamationmark.triangle.fill",
  icon_colorBad: "#FF3B30",
  icon_statusUnknown: "questionmark.circle.fill",
  icon_colorUnknown: "#FFD60A",

  failIcon: "❌",
  bulletPointIcon: "▫️",
  decimalChar: ".", // Character to use as decimal separator
  
  // Widget title and logo
  widgetTitle: " Homebridge ",
  logoUrl:
    "https://raw.githubusercontent.com/homebridge/branding/latest/logos/homebridge-silhouette-round-white.png",
  hbLogoFileName: `${Device.model()}hbLogo.png`, // Local cached logo file
  
  // Font sizes
  headerFontSize: 12,
  informationFontSize: 10,
  chartAxisFontSize: 7,
  dateFontSize: 7,
  
  // Layout spacings (pixels)
  spacer_beforeFirstStatusColumn: 8,
  spacer_betweenStatusColumns: 5,
  spacer_afterSecondColumn: 0,
  verticalSpacerInfoPanel: 5,
  
  maxLineWidth: 300,
  normalLineHeight: 35,
  
  // Titles for status panel
  title_cpuLoad: "CPU Load: ",
  title_cpuTemp: "CPU Temp: ",
  title_ramUsage: "RAM Usage: ",
  title_uptimes: "Uptimes:",
  title_uiService: "UI-Service: ",
  title_systemGuiName: "Raspberry Pi:",
  
  // Error message when Homebridge is unreachable
  error_noConnectionText: `❌ UI-Service not reachable!`,
  
  // Date format used throughout the widget
  dateFormat: "MM-dd-yyyy HH:mm:ss",
});

// === GLOBAL VARIABLES ===
const UNAVAILABLE = "UNAVAILABLE"; // Value to indicate unavailable token or data
let token, fileManager;

// Formatter for "Last refreshed" timestamps
const timeFormatter = new DateFormatter();
timeFormatter.dateFormat = CONFIG.dateFormat;

// === BACKGROUND GRADIENT ===
// Creates a dark purple vertical gradient for widget background
const darkPurpleGradientBackground = (() => {
  const gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [new Color("#250b3b"), new Color("#320d47")];
  return gradient;
})();

// === HELPER FUNCTIONS ===
// Round number to 'd' decimal places and replace decimal character
const formatNumber = (value, decimal = 1) =>
  (+value.toFixed(decimal)).toString().replace(".", CONFIG.decimalChar);

// Convert number to rounded string (wrapper)
const getAsRoundedString = (value, decimal) => formatNumber(Number(value), decimal);

// Convert Celsius temperature to Fahrenheit string with 1 decimal
const getTemperatureString = (celsius) =>
  `${getAsRoundedString((celsius * 9) / 5 + 32, 1)}°F`;

// Set text color for a Text element
const setTextColor = (text, color = CONFIG.fontColor) => (text.textColor = new Color(color));

// Add a text element to a stack with optional font and color
const addText = (stack, text, font, color) => {
  const textElement = stack.addText(text);
  if (font) textElement.font = font;
  setTextColor(textElement, color);
  return textElement;
};

// Add an SF Symbol icon to a stack with a tint color
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
    iconName = CONFIG.icon_statusUnknown;
    colorHex = CONFIG.icon_colorUnknown;
  } else if (status) {
    iconName = CONFIG.icon_statusGood;
    colorHex = CONFIG.icon_colorGood;
  } else {
    iconName = CONFIG.icon_statusBad;
    colorHex = CONFIG.icon_colorBad;
  }
  addIcon(stack, iconName, colorHex);
};

// Add a status line with icon and text
const addStatusInfo = (stack, status, text) => {
  const statusWidgetStack = stack.addStack();
  addStatusIcon(statusWidgetStack, status);
  statusWidgetStack.addSpacer(2);
  const statusText = statusWidgetStack.addText(text);
  statusText.font = Font.semiboldMonospacedSystemFont(CONFIG.informationFontSize);
  setTextColor(statusText);
};

// === LINE GRAPH ===
class LineChart {
  constructor(widgth, height, values) {
    this.context = new DrawContext();
    this.context.size = new Size(widgth, height);
    this.values = values || [0];
  }
  
  // Generate a smooth path for the line chart based on values
  _path() {
    const v = this.values;
    const w = this.context.size.width;
    const h = this.context.size.height;
    const max = Math.max(...v),
      min = Math.min(...v);
    const r = max === min ? 1 : max - min;
    const step = w / Math.max(1, v.length - 1);

    const p = new Path();
    p.move(new Point(0, h));

    v.forEach((val, i) => {
      const y = h - ((val - min) / r) * h;
      const x = i * step;
      if (i === 0) p.addLine(new Point(x, y));
      else {
        const prevX = (i - 1) * step;
        const prevY = h - ((v[i - 1] - min) / r) * h;
        const m = new Point((prevX + x) / 2, (prevY + y) / 2);
        p.addQuadCurve(m, new Point((m.x + prevX) / 2, prevY));
        p.addQuadCurve(new Point(x, y), new Point((m.x + x) / 2, y));
      }
    });

    p.addLine(new Point(w, h));
    p.closeSubpath();
    return p;
  }

  // Render the chart as an image
  getImage(colorHex) {
    const path = this._path();
    this.context.opaque = false;
    this.context.setFillColor(new Color(colorHex || CONFIG.chartColor));
    this.context.addPath(path);
    this.context.fillPath();
    return this.context.getImage();
  }
}

// === FILE HANDLING ===
// Get local path for a given filename (creates directory if missing)
const getFilePath = (fileName) => {
  const directory = fileManager.joinPath(
    fileManager.documentsDirectory(),
    "Home Bridge Status"
  );
  if (!fileManager.fileExists(directory)) fileManager.createDirectory(directory);
  return fileManager.joinPath(directory, fileName);
}; 

// Load image from a URL
const loadImage = async (url) => {
  const request = new Request(url);
  request.timeoutInterval = CONFIG.requestTimeoutInterval;
  return await request.loadImage();
};

// Get Homebridge logo image, cached locally (downloads if missing)
const getHbLogoImage = async () => {
  const path = getFilePath(CONFIG.hbLogoFileName);
  if (fileManager.fileExists(path)) {
    if (!(await fileManager.isFileDownloaded(path)))
      await fileManager.downloadFileFromiCloud(path);
    return fileManager.readImage(path);
  }
  const image = await loadImage(CONFIG.logoUrl);
  fileManager.writeImage(path, image);
  return image;
};

// === NETWORK ===

// Construct full API endpoint URL
const api = (path) => CONFIG.hbServiceMachineBaseUrl.replace(/\/$/, "") + path;

// Attempt to load JSON from a request
const tryLoadJSON = async (request) => {
  try {
    return await request.loadJSON();
  } catch {
    return undefined;
  }
};

// Get authentication token, trying no-auth endpoint first, then login
const getAuthToken = async () => {
  const headers = { accept: "*/*", "Content-Type": "application/json" };
  
  // Attempt no-auth
  const noAuthRequired = new Request(api("/api/auth/noauth"));
  noAuthRequired.method = "POST";
  noAuthRequired.timeoutInterval = CONFIG.requestTimeoutInterval;
  noAuthRequired.headers = headers;
  noAuthRequired.body = "{}";

  const token = (await tryLoadJSON(noAuthRequired))?.access_token;
  if (token) return token;

  // Fallback to login endpoint
  const loginRequired = new Request(api("/api/auth/login"));
  loginRequired.method = "POST";
  loginRequired.timeoutInterval = CONFIG.requestTimeoutInterval;
  loginRequired.headers = headers;
  loginRequired.body = JSON.stringify({
    username: CONFIG.userName,
    password: CONFIG.password,
    otp: "string",
  });

  return (await tryLoadJSON(loginRequired))?.access_token || UNAVAILABLE;
};

// Fetch JSON data from Homebridge API with authorization header
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

// === HOMEBRIDGE STATUS ===
class HomeBridgeStatus {
  async initialize() {
    // Fetch multiple API endpoints in parallel
    const [status, homebridgeVersion, plugins, nodeJs, cpu, ram, uptime] = await Promise.all([
      fetchData(api("/api/status/homebridge")),
      fetchData(api("/api/status/homebridge-version")),
      fetchData(api("/api/plugins")),
      fetchData(api("/api/status/nodejs")),
      fetchData(api("/api/status/cpu")),
      fetchData(api("/api/status/ram")),
      fetchData(api("/api/status/uptime")),
    ]);
    
    // Determine status flags (true/false/undefined)
    this.overallStatus = "up"; // hard coding status as "up" since widget has fallback display if service can't be reached
    // Otherwise check API reslonse fkr if service is running
    // this.overallStatus = s?.status === "up"; 
    this.hbUpToDate = homebridgeVersion ? !homebridgeVersion.updateAvailable : undefined;
    this.pluginsUpToDate = plugins ? !plugins.some((p) => p.updateAvailable) : undefined;
    this.nodeJsUpToDate = nodeJs ? !nodeJs.updateAvailable : undefined;

    this.cpuData = cpu;
    this.ramData = ram;
    
    // Compute formatted uptimes (system and UI)
    if (uptime) {
      const system = uptime.time?.uptime ?? uptime.uptime ?? "unknown";
      const homebridgeUi =
        uptime.time?.uiUptime ??
        uptime.time?.processUptime ??
        uptime.processUptime ??
        "unknown";
      this.uptimesArray = [
        system !== "unknown" ? formatSeconds(system) : "unknown",
        homebridgeUi !== "unknown" ? formatSeconds(homebridgeUi) : "unknown",
      ];
    } else {
      this.uptimesArray = ["unknown", "unknown"];
    }

    return this;
  }
}

// === UTILITY FUNCTIONS ===
const formatSeconds = (value) => {
  if (value > 864000) return `${getAsRoundedString(value / 86400, 0)}d`;
  if (value > 86400) return `${getAsRoundedString(value / 86400, 1)}d`;
  if (value > 3600) return `${getAsRoundedString(value / 3600, 1)}h`;
  if (value > 60) return `${getAsRoundedString(value / 60, 1)}m`;
  return `${getAsRoundedString(value, 1)}s`;
};

const getUsedRamString = (ram) =>
  ram
    ? getAsRoundedString(100 - (100 * ram.mem.available) / ram.mem.total, 2)
    : "unknown";

// === FONTS ===
let headerFont, infoFont, chartAxisFont, updatedAtFont;

// Initialize fonts once for consistent use
const initializeFonts = () => {
  headerFont = Font.boldMonospacedSystemFont(CONFIG.headerFontSize);
  infoFont = Font.systemFont(CONFIG.informationFontSize);
  chartAxisFont = Font.systemFont(CONFIG.chartAxisFontSize);
  updatedAtFont = Font.systemFont(CONFIG.dateFontSize);
};

// === UI SETUP ===
const handleBackground = (widget) => (widget.backgroundGradient = darkPurpleGradientBackground);

// Add Homebridge logo and widget title; sets stack size
const initializeLogoAndHeader = async (status) => {
  status.size = new Size(CONFIG.maxLineWidth, CONFIG.normalLineHeight);
  const logo = await getHbLogoImage();
  const imageStack = status.addImage(logo);
  imageStack.imageSize = new Size(40, 30);
  addText(status, CONFIG.widgetTitle, headerFont).size = new Size(
    60,
    CONFIG.normalLineHeight
  );
};

// Build status panel in header: 2 columns (overall/plugins, UI/Node.js)
const buildStatusPanelInHeader = (status, homebridgeStatus) => {
  status.addSpacer(CONFIG.spacer_beforeFirstStatusColumn);

  const statusInfo = status.addStack();

  // Column 1: Overall status and Plugins status
  const statusColumn1 = statusInfo.addStack();
  statusColumn1.layoutVertically();
  addStatusInfo(statusColumn1, homebridgeStatus.overallStatus, "Running");
  statusColumn1.addSpacer(CONFIG.verticalSpacerInfoPanel);
  addStatusInfo(statusColumn1, homebridgeStatus.pluginsUpToDate, "Plugins UTD");

  statusInfo.addSpacer(CONFIG.spacer_betweenStatusColumns);

  // Column 2: Homebridge UI status and Node.js status
  const statusColumn2 = statusInfo.addStack();
  statusColumn2.layoutVertically();
  addStatusInfo(statusColumn2, homebridgeStatus.hbUpToDate, "UI UTD");
  statusColumn2.addSpacer(CONFIG.verticalSpacerInfoPanel);
  addStatusInfo(statusColumn2, homebridgeStatus.nodeJsUpToDate, "Node.js UTD");

  status.addSpacer(CONFIG.spacer_afterSecondColumn);
};

// Add line chart to widget with Y-axis and X-axis labels
const addChartToWidget = (col, data) => {
  if (!data) return;

  const headerStack = col.addStack();
  headerStack.addSpacer(5);
  const yLabels = headerStack.addStack();
  yLabels.layoutVertically();

  const maxV = Math.max(...data);
  const minV = Math.min(...data);

  addText(yLabels, `${getAsRoundedString(maxV, 2)}%`, chartAxisFont);
  yLabels.addSpacer(6);
  addText(yLabels, `${getAsRoundedString(minV, 2)}%`, chartAxisFont);
  yLabels.addSpacer(6);

  headerStack.addSpacer(2);

  const chartImage = new LineChart(500, 100, data).getImage(CONFIG.chartColor);
  const vChart = headerStack.addStack();
  vChart.layoutVertically();
  vChart.addImage(chartImage).imageSize = new Size(100, 25);

  const xAxis = vChart.addStack();
  xAxis.size = new Size(100, 10);
  addText(xAxis, "t-10m", chartAxisFont);
  xAxis.addSpacer(75);
  addText(xAxis, "t", chartAxisFont);
};

// Add "not available" info and last refresh time when data is missing
const addNotAvailableInfos = (widget, now) => {
  const text = widget.addText(CONFIG.error_noConnectionText);
  text.font = infoFont;
  setTextColor(text);
  widget.addSpacer(15);
  const lastRefresh = widget.addText(`Last refreshed: ${timeFormatter.string(now)}`);
  lastRefresh.font = updatedAtFont;
  setTextColor(lastRefresh);
  lastRefresh.centerAlignText();
};

// Build entire widget with status, charts, and uptime info
const buildFullWidget = async (widget, homebridgeStatus, now) => {
  widget.addSpacer(10);
  const titleStack = widget.addStack();
  await initializeLogoAndHeader(titleStack);
  buildStatusPanelInHeader(titleStack, homebridgeStatus);
  widget.addSpacer(10);

  if (!homebridgeStatus.cpuData || !homebridgeStatus.ramData) {
    addNotAvailableInfos(widget, now);
    return;
  }

  const mainColumns = widget.addStack();
  mainColumns.size = new Size(CONFIG.maxLineWidth, 77);
  mainColumns.addSpacer(4);

  // CPU Column
  const cpuColumn = mainColumns.addStack();
  cpuColumn.layoutVertically();
  addText(
    cpuColumn,
    `${CONFIG.title_cpuLoad}${getAsRoundedString(homebridgeStatus.cpuData.currentLoad, 1)}%`,
    infoFont
  );
  addChartToWidget(cpuColumn, homebridgeStatus.cpuData.cpuLoadHistory);
  cpuColumn.addSpacer(7);

  const textString = homebridgeStatus.cpuData?.cpuTemperature?.main
    ? getTemperatureString(homebridgeStatus.cpuData.cpuTemperature.main)
    : null;
  if (textString) {
    const temperatureText = addText(cpuColumn, `${CONFIG.title_cpuTemp}${textString}`, infoFont);
    temperatureText.size = new Size(150, 30);
    setTextColor(temperatureText);
  }

  mainColumns.addSpacer(11);

  // RAM Column
  const ramColumn = mainColumns.addStack();
  ramColumn.layoutVertically();
  addText(
    ramColumn,
    `${CONFIG.title_ramUsage}${getUsedRamString(homebridgeStatus.ramData)}%`,
    infoFont
  );
  addChartToWidget(ramColumn, homebridgeStatus.ramData.memoryUsageHistory);
  ramColumn.addSpacer(7);

  // Uptime info
  if (homebridgeStatus.uptimesArray) {
    const upTimeStack = ramColumn.addStack();
    const upTimeColumn = upTimeStack.addStack();
    addText(upTimeColumn, CONFIG.title_uptimes, infoFont);

    const valuePoints = upTimeColumn.addStack();
    valuePoints.layoutVertically();
    addText(
      valuePoints,
      `${CONFIG.bulletPointIcon}${CONFIG.title_systemGuiName}${homebridgeStatus.uptimesArray[0]}`,
      infoFont
    );
    addText(
        valuePoints,
        `${CONFIG.bulletPointIcon}${CONFIG.title_uiService}${homebridgeStatus.uptimesArray[1]}`,
        infoFont
      );
    }
  
    widget.addSpacer(10);
    const updatedAt = addText(
      widget,
      `Last refreshed: ${timeFormatter.string(now)}`,
      updatedAtFont
    );
    updatedAt.centerAlignText();
  };

// === EXECUTE SCRIPT ===
(async () => {
  const now = new Date();
  fileManager = FileManager.local(); // Local file manager for caching
  initializeFonts(); // Initialize fonts for consistent use

  token = await getAuthToken(); // Get auth token

  const widget = new ListWidget();
  handleBackground(widget); // Set background gradient

  if (token === UNAVAILABLE) {
    // If token is unavailable, show error
    await initializeLogoAndHeader(widget.addStack());
    addNotAvailableInfos(widget, now);
  } else {
    // Otherwise, fetch Homebridge status and build full widget
    const homebridgeStatus = await new HomeBridgeStatus().initialize();
    await buildFullWidget(widget, homebridgeStatus, now);
  }

  if (!config.runsInWidget) await widget.presentMedium(); 

  Script.setWidget(widget);
  Script.complete(); 
})();
