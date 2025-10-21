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
  fontColor: "#FFFFFF", // Default text color

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
const purpleBgGradient_dark = (() => {
  const g = new LinearGradient();
  g.locations = [0, 1];
  g.colors = [new Color("#250b3b"), new Color("#320d47")];
  return g;
})();

// === HELPER FUNCTIONS ===
// Round number to 'd' decimal places and replace decimal character
const formatNumber = (v, d = 1) =>
  (+v.toFixed(d)).toString().replace(".", CONFIG.decimalChar);

// Convert number to rounded string (wrapper)
const getAsRoundedString = (v, d) => formatNumber(Number(v), d);

// Convert Celsius temperature to Fahrenheit string with 1 decimal
const getTemperatureString = (c) =>
  `${getAsRoundedString((c * 9) / 5 + 32, 1)}°F`;

// Set text color for a Text element
const setTextColor = (t, c = CONFIG.fontColor) => (t.textColor = new Color(c));

// Add a text element to a stack with optional font and color
const addText = (stack, text, font, color) => {
  const t = stack.addText(text);
  if (font) t.font = font;
  setTextColor(t, color);
  return t;
};

// Add an SF Symbol icon to a stack with a tint color
const addIcon = (stack, name, colorHex) => {
  const i = stack.addImage(SFSymbol.named(name).image);
  i.resizable = true;
  i.imageSize = new Size(13, 13);
  i.tintColor = new Color(colorHex);
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
  const s = stack.addStack();
  addStatusIcon(s, status);
  s.addSpacer(2);
  const t = s.addText(text);
  t.font = Font.semiboldMonospacedSystemFont(CONFIG.informationFontSize);
  setTextColor(t);
};

// === LINE GRAPH ===
class LineChart {
  constructor(w, h, values) {
    this.ctx = new DrawContext();
    this.ctx.size = new Size(w, h);
    this.values = values || [0];
  }

  // Generate a smooth path for the line chart based on values
  _path() {
    const v = this.values;
    const w = this.ctx.size.width;
    const h = this.ctx.size.height;
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
    const p = this._path();
    this.ctx.opaque = false;
    this.ctx.setFillColor(new Color(colorHex || CONFIG.chartColor));
    this.ctx.addPath(p);
    this.ctx.fillPath();
    return this.ctx.getImage();
  }
}

// === FILE HANDLING ===
// Get local path for a given filename (creates directory if missing)
const getFilePath = (fileName) => {
  const directory = fileManager.joinPath(
    fileManager.documentsDirectory(),
    "Home Bridge Status"
  );
  if (!fileManager.fileExists(directory))
    fileManager.createDirectory(directory);
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
  const noAuthReq = new Request(api("/api/auth/noauth"));
  noAuthReq.method = "POST";
  noAuthReq.timeoutInterval = CONFIG.requestTimeoutInterval;
  noAuthReq.headers = headers;
  noAuthReq.body = "{}";

  const token = (await tryLoadJSON(noAuthReq))?.access_token;
  if (token) return token;

  // Fallback to login endpoint
  const loginReq = new Request(api("/api/auth/login"));
  loginReq.method = "POST";
  loginReq.timeoutInterval = CONFIG.requestTimeoutInterval;
  loginReq.headers = headers;
  loginReq.body = JSON.stringify({
    username: CONFIG.userName,
    password: CONFIG.password,
    otp: "string",
  });

  return (await tryLoadJSON(loginReq))?.access_token || UNAVAILABLE;
};

// Fetch JSON data from Homebridge API with authorization header
const fetchData = async (url) => {
  const req = new Request(url);
  req.method = "GET";
  req.timeoutInterval = CONFIG.requestTimeoutInterval;
  req.headers = {
    accept: "*/*",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  return await tryLoadJSON(req);
};

// === HOMEBRIDGE STATUS ===
class HomeBridgeStatus {
  async initialize() {
    // Fetch multiple API endpoints in parallel
    const [s, hbV, pl, njs, cpu, ram, uptime] = await Promise.all([
      fetchData(api("/api/status/homebridge")),
      fetchData(api("/api/status/homebridge-version")),
      fetchData(api("/api/plugins")),
      fetchData(api("/api/status/nodejs")),
      fetchData(api("/api/status/cpu")),
      fetchData(api("/api/status/ram")),
      fetchData(api("/api/status/uptime")),
    ]);

    // Determine status flags (true/false/undefined)
    this.overallStatus = s?.status === "up";
    this.hbUpToDate = hbV ? !hbV.updateAvailable : undefined;
    this.pluginsUpToDate = pl ? !pl.some((p) => p.updateAvailable) : undefined;
    this.nodeJsUpToDate = njs ? !njs.updateAvailable : undefined;

    this.cpuData = cpu;
    this.ramData = ram;

    // Compute formatted uptimes (system and UI)
    if (uptime) {
      const sys = uptime.time?.uptime ?? uptime.uptime ?? "unknown";
      const ui =
        uptime.time?.uiUptime ??
        uptime.time?.processUptime ??
        uptime.processUptime ??
        "unknown";
      this.uptimesArray = [
        sys !== "unknown" ? formatSeconds(sys) : "unknown",
        ui !== "unknown" ? formatSeconds(ui) : "unknown",
      ];
    } else {
      this.uptimesArray = ["unknown", "unknown"];
    }

    return this;
  }
}

// === UTILITY FUNCTIONS ===
const formatSeconds = (v) => {
  if (v > 864000) return `${getAsRoundedString(v / 86400, 0)}d`;
  if (v > 86400) return `${getAsRoundedString(v / 86400, 1)}d`;
  if (v > 3600) return `${getAsRoundedString(v / 3600, 1)}h`;
  if (v > 60) return `${getAsRoundedString(v / 60, 1)}m`;
  return `${getAsRoundedString(v, 1)}s`;
};

const getUsedRamString = (r) =>
  r
    ? getAsRoundedString(100 - (100 * r.mem.available) / r.mem.total, 2)
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
const handleBackground = (w) => (w.backgroundGradient = purpleBgGradient_dark);

// Add Homebridge logo and widget title; sets stack size
const initializeLogoAndHeader = async (s) => {
  s.size = new Size(CONFIG.maxLineWidth, CONFIG.normalLineHeight);
  const logo = await getHbLogoImage();
  const imgStack = s.addImage(logo);
  imgStack.imageSize = new Size(40, 30);
  addText(s, CONFIG.widgetTitle, headerFont).size = new Size(
    60,
    CONFIG.normalLineHeight
  );
};

// Build status panel in header: 2 columns (overall/plugins, UI/Node.js)
const buildStatusPanelInHeader = (s, hbStatus) => {
  s.addSpacer(CONFIG.spacer_beforeFirstStatusColumn);

  const statusInfo = s.addStack();

  // Column 1: Overall status and Plugins status
  const col1 = statusInfo.addStack();
  col1.layoutVertically();
  addStatusInfo(col1, hbStatus.overallStatus, "Running");
  col1.addSpacer(CONFIG.verticalSpacerInfoPanel);
  addStatusInfo(col1, hbStatus.pluginsUpToDate, "Plugins UTD");

  statusInfo.addSpacer(CONFIG.spacer_betweenStatusColumns);

  // Column 2: Homebridge UI status and Node.js status
  const col2 = statusInfo.addStack();
  col2.layoutVertically();
  addStatusInfo(col2, hbStatus.hbUpToDate, "UI UTD");
  col2.addSpacer(CONFIG.verticalSpacerInfoPanel);
  addStatusInfo(col2, hbStatus.nodeJsUpToDate, "Node.js UTD");

  s.addSpacer(CONFIG.spacer_afterSecondColumn);
};

// Add line chart to widget with Y-axis and X-axis labels
const addChartToWidget = (col, data) => {
  if (!data) return;

  const hS = col.addStack();
  hS.addSpacer(5);
  const yLabels = hS.addStack();
  yLabels.layoutVertically();

  const maxV = Math.max(...data);
  const minV = Math.min(...data);

  addText(yLabels, `${getAsRoundedString(maxV, 2)}%`, chartAxisFont);
  yLabels.addSpacer(6);
  addText(yLabels, `${getAsRoundedString(minV, 2)}%`, chartAxisFont);
  yLabels.addSpacer(6);

  hS.addSpacer(2);

  const chartImg = new LineChart(500, 100, data).getImage(CONFIG.chartColor);
  const vChart = hS.addStack();
  vChart.layoutVertically();
  vChart.addImage(chartImg).imageSize = new Size(100, 25);

  const xAxis = vChart.addStack();
  xAxis.size = new Size(100, 10);
  addText(xAxis, "t-10m", chartAxisFont);
  xAxis.addSpacer(75);
  addText(xAxis, "t", chartAxisFont);
};

// Add "not available" info and last refresh time when data is missing
const addNotAvailableInfos = (w, now) => {
  const t = w.addText(CONFIG.error_noConnectionText);
  t.font = infoFont;
  setTextColor(t);
  w.addSpacer(15);
  const u = w.addText(`Last refreshed: ${timeFormatter.string(now)}`);
  u.font = updatedAtFont;
  setTextColor(u);
  u.centerAlignText();
};

// Build entire widget with status, charts, and uptime info
const buildFullWidget = async (w, hbStatus, now) => {
  w.addSpacer(10);
  const titleStack = w.addStack();
  await initializeLogoAndHeader(titleStack);
  buildStatusPanelInHeader(titleStack, hbStatus);
  w.addSpacer(10);

  if (!hbStatus.cpuData || !hbStatus.ramData) {
    addNotAvailableInfos(w, now);
    return;
  }

  const mainCols = w.addStack();
  mainCols.size = new Size(CONFIG.maxLineWidth, 77);
  mainCols.addSpacer(4);

  // CPU Column
  const cpuCol = mainCols.addStack();
  cpuCol.layoutVertically();
  addText(
    cpuCol,
    `${CONFIG.title_cpuLoad}${getAsRoundedString(
      hbStatus.cpuData.currentLoad,
      1
    )}%`,
    infoFont
  );
  addChartToWidget(cpuCol, hbStatus.cpuData.cpuLoadHistory);
  cpuCol.addSpacer(7);

  const tStr = hbStatus.cpuData?.cpuTemperature?.main
    ? getTemperatureString(hbStatus.cpuData.cpuTemperature.main)
    : null;
  if (tStr) {
    const t = addText(cpuCol, `${CONFIG.title_cpuTemp}${tStr}`, infoFont);
    t.size = new Size(150, 30);
    setTextColor(t);
  }

  mainCols.addSpacer(11);

  // RAM Column
  const ramCol = mainCols.addStack();
  ramCol.layoutVertically();
  addText(
    ramCol,
    `${CONFIG.title_ramUsage}${getUsedRamString(hbStatus.ramData)}%`,
    infoFont
  );
  addChartToWidget(ramCol, hbStatus.ramData.memoryUsageHistory);
  ramCol.addSpacer(7);

  // Uptime info
  if (hbStatus.uptimesArray) {
    const upStack = ramCol.addStack();
    const upCol = upStack.addStack();
    addText(upCol, CONFIG.title_uptimes, infoFont);

    const vPts = upCol.addStack();
    vPts.layoutVertically();
    addText(
      vPts,
      `${CONFIG.bulletPointIcon}${CONFIG.title_systemGuiName}${hbStatus.uptimesArray[0]}`,
      infoFont
    );
    addText(
      vPts,
      `${CONFIG.bulletPointIcon}${CONFIG.title_uiService}${hbStatus.uptimesArray[1]}`,
      infoFont
    );
  }

  w.addSpacer(10);
  const updatedAt = addText(
    w,
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
    const hbStatus = await new HomeBridgeStatus().initialize();
    await buildFullWidget(widget, hbStatus, now);
  }

  if (!config.runsInWidget) await widget.presentMedium();

  Script.setWidget(widget);
  Script.complete();
})();
