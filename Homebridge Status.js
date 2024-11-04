// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;

let configurationFileName = "<INSERT CONFIG NAME.json>";
const usePersistedConfiguration = true;
const overwritePersistedConfig = false;
const CONFIGURATION_JSON_VERSION = 3;

// Begin configuration setup
class Configuration {
        hbServiceMachineBaseUrl = "<INSERT IP ADDRESS AND PORT>";
        userName = "<INSERT HOMEBRIDGE USERNAME>";
        password = "<INSERT HOMEBRIDGE PASSWORD>";
        notificationEnabled = true;
        notificationIntervalInDays = 1;
        disableStateBackToNormalNotifications = true;
        fileManagerMode = "ICLOUD";
        temperatureUnitConfig = "FAHRENHEIT";
        requestTimeoutInterval = 15;
        pluginsOrSwUpdatesToIgnore = [];
        adaptToLightOrDarkMode = true;
        bgColorMode = "PURPLE_DARK";
        chartColor_dark = "#FFFFFF";
        fontColor_dark = "#FFFFFF";
        failIcon = "❌";
        bulletPointIcon = "▫️";
        decimalChar = ".";
        jsonVersion = CONFIGURATION_JSON_VERSION;
        logoUrl = "https://github.com/homebridge/branding/blob/master/logos/homebridge-silhouette-round-white.png?raw=true";

        // Icons:
        icon_statusGood = "checkmark.circle.fill";
        icon_colorGood = "#" + Color.green().hex; 
        icon_statusBad = "exclamationmark.triangle.fill"; 
        icon_colorBad = "#" + Color.red().hex; 
        icon_statusUnknown = "questionmark.circle.fill"; 
        icon_colorUnknown = "#" + Color.yellow().hex; 

        // Internationalization:
        status_hbRunning = "Running";
        status_hbUtd = "UTD";
        status_pluginsUtd = "Plugins UTD  ";
        status_nodejsUtd = "Node.js UTD  ";
        spacer_beforeFirstStatusColumn = 8;
        spacer_betweenStatusColumns = 5;
        spacer_afterSecondColumn = 0;
      
        title_cpuLoad = "CPU Load: ";
        title_cpuTemp = "CPU Temp: ";
        title_ramUsage = "RAM Usage: ";
        title_uptimes = "Uptimes:";
      
        title_uiService = "UI-Service: ";
        title_systemGuiName = "Raspberry Pi: ";
      
        notification_title = "Homebridge Status changed:";
        notification_expandedButtonText = "Details";
        notification_ringTone = "event";
      
        notifyText_hbNotRunning = "Your Homebridge instance stopped";
        notifyText_hbNotUtd = "Update available for Homebridge";
        notifyText_pluginsNotUtd = "Update available for one of your Plugins";
      
        notifyText_nodejsNotUtd = "Update available for Node.js";
        notifyText_hbNotRunning_backNormal = "Your Homebridge instance is back online";
        notifyText_hbNotUtd_backNormal = "Homebridge is now up to date";
        notifyText_pluginsNotUtd_backNormal = "Plugins are now up to date";
        notifyText_nodejsNotUtd_backNormal = "Node.js is now up to date";
      
        siriGui_title_update_available = "Available Updates:";
        siriGui_title_all_UTD = "Everything is up to date!";
        siriGui_icon_version = "arrow.right.square.fill";
        siriGui_icon_version_color = "#" + Color.blue().hex;
        siri_spokenAnswer_update_available = "At least one update is available";
        siri_spokenAnswer_all_UTD = "Everything is up to date";

        error_noConnectionText = "   " + 
            this.failIcon + " UI-Service not reachable!\n          " + 
            this.bulletPointIcon + " Server started?\n          " + 
            this.bulletPointIcon + " UI-Service process started?\n          " + 
            this.bulletPointIcon + " Server-URL " +
            this.hbServiceMachineBaseUrl + " correct?\n          " +
            this.bulletPointIcon + " Are you in the same network?"; 
  
        error_noConnectionLockScreenText = "  " +
            this.failIcon + " UI-Service not reachable!\n    " +
            this.bulletPointIcon + " Server started?\n    " +
            this.bulletPointIcon + " UI-Service process started?\n    " +
            this.bulletPointIcon + " " +
            this.hbServiceMachineBaseUrl + " correct?\n    " + this.bulletPointIcon + " Are you in the same network?";
      
        widgetTitle = " Homebridge ";
        dateFormat = "MM-dd-yyyy HH:mm:ss";
        hbLogoFileName = Device.model() + "hbLogo.png";
        headerFontSize = 12;
        informationFontSize = 10;
        chartAxisFontSize = 7;
        dateFontSize = 7;
        notificationJsonFileName = "notificationState.json";
      };
// End of configuration setup

let CONFIGURATION = new Configuration();
const noAuthUrl = () => CONFIGURATION.hbServiceMachineBaseUrl + "/api/auth/noauth";
const authUrl = () => CONFIGURATION.hbServiceMachineBaseUrl + "/api/auth/login";
const cpuUrl = () => CONFIGURATION.hbServiceMachineBaseUrl + "/api/status/cpu";
const overallStatusUrl = () => CONFIGURATION.hbServiceMachineBaseUrl + "/api/status/homebridge";
const ramUrl = () => CONFIGURATION.hbServiceMachineBaseUrl + "/api/status/ram";
const uptimeUrl = () => CONFIGURATION.hbServiceMachineBaseUrl + "/api/status/uptime";
const pluginsUrl = () => CONFIGURATION.hbServiceMachineBaseUrl + "/api/plugins";
const hbVersionUrl = () => CONFIGURATION.hbServiceMachineBaseUrl + "/api/status/homebridge-version";
const nodeJsUrl = () => CONFIGURATION.hbServiceMachineBaseUrl + "/api/status/nodejs";
const timeFormatter = new DateFormatter();
const maxLineWidth = 300; 
const normalLineHeight = 35;
let headerFont, infoFont, chartAxisFont, updatedAtFont, token, fileManager;

let infoPanelFont = Font.semiboldMonospacedSystemFont(10);
let iconSize = 13;
let verticalSpacerInfoPanel = 5;

const purpleBgGradient_light = createLinearGradient("#421367", "#481367");
const purpleBgGradient_dark = createLinearGradient("#250b3b", "#320d47");
const blackBgGradient_light = createLinearGradient("#707070", "#3d3d3d");
const blackBgGradient_dark = createLinearGradient("#111111", "#222222");

const UNAVAILABLE = "UNAVAILABLE";

const NOTIFICATION_JSON_VERSION = 1; 

const INITIAL_NOTIFICATION_STATE = {
        jsonVersion: NOTIFICATION_JSON_VERSION,
        hbRunning: { status: true },
        hbUtd: { status: true },
        pluginsUtd: { status: true },
        nodeUtd: { status: true },
};

class LineChart {
        constructor(width, height, values) {
                this.ctx = new DrawContext();
                this.ctx.size = new Size(width, height);
                this.values = values;
        };
        _calculatePath() {
                let maxValue = Math.max(...this.values);
                let minValue = Math.min(...this.values);
                let difference = maxValue - minValue;
                let count = this.values.length;
                let step = this.ctx.size.width / (count - 1);
                let points = this.values.map((current, index, all) => {
                        let x = step * index;
                        let y = this.ctx.size.height - ((current - minValue) / difference) * this.ctx.size.height;
                return new Point(x, y);
        });
        return this._getSmoothPath(points);
        };
        _getSmoothPath(points) {
                let path = new Path();
                path.move(new Point(0, this.ctx.size.height));
                path.addLine(points[0]);
                for (let i = 0; i < points.length - 1; i++) {
                        let xAvg = (points[i].x + points[i + 1].x) / 2;
                      let yAvg = (points[i].y + points[i + 1].y) / 2;
                      let avg = new Point(xAvg, yAvg);
                      let cp1 = new Point((xAvg + points[i].x) / 2, points[i].y);
                      let next = new Point(points[i + 1].x, points[i + 1].y);
                      let cp2 = new Point((xAvg + points[i + 1].x) / 2, points[i + 1].y);
                      path.addQuadCurve(avg, cp1);
                      path.addQuadCurve(next, cp2);
              };
      path.addLine(new Point(this.ctx.size.width, this.ctx.size.height));
      path.closeSubpath();
      return path;
      };

      configure(fn) {
              let path = this._calculatePath();
              if (fn) {
                      fn(this.ctx, path);
                } else {
                      this.ctx.addPath(path);
                      this.ctx.fillPath(path);
                };
                return this.ctx;
        };
};

class HomeBridgeStatus {
        overallStatus;
        hbVersionInfos;
        hbUpToDate;
        pluginVersionInfos;
        pluginsUpToDate;
        nodeJsVersionInfos;
        nodeJsUpToDate;
        constructor() {}

        async initialize() {
                this.overallStatus = await getOverallStatus();
                this.hbVersionInfos = await getHomebridgeVersionInfos();
                this.hbUpToDate =
                this.hbVersionInfos === undefined? undefined: !this.hbVersionInfos.updateAvailable;
                this.pluginVersionInfos = await getPluginVersionInfos();
                this.pluginsUpToDate =
                this.pluginVersionInfos === undefined? undefined: !this.pluginVersionInfos.updateAvailable;
                this.nodeJsVersionInfos = await getNodeJsVersionInfos();
                this.nodeJsUpToDate =
                this.nodeJsVersionInfos === undefined? undefined: !this.nodeJsVersionInfos.updateAvailable;
        return this;
        };
};

// Begin widget creation
await initializeFileManager_Configuration_TimeFormatter_Fonts_AndToken();
if (token === UNAVAILABLE) {
        await showNotAvailableWidget();
        return;
};
const homeBridgeStatus = await new HomeBridgeStatus().initialize();
await handleConfigPersisting();
await handleNotifications(
        homeBridgeStatus.overallStatus,
        homeBridgeStatus.hbUpToDate,
        homeBridgeStatus.pluginsUpToDate,
        homeBridgeStatus.nodeJsUpToDate
);
await createAndShowWidget(homeBridgeStatus);
return;

// End of widget creation

async function initializeFileManager_Configuration_TimeFormatter_Fonts_AndToken() {
        fileManager = CONFIGURATION.fileManagerMode === "LOCAL"? FileManager.local(): FileManager.iCloud();
        if (args.widgetParameter) {
                if (args.widgetParameter.length > 0) {
                        let foundCredentialsInParameter = useCredentialsFromWidgetParameter(args.widgetParameter);
                        let fileNameSuccessfullySet = false;
                        if (!foundCredentialsInParameter) {
                                fileNameSuccessfullySet = checkIfConfigFileParameterIsProvided(args.widgetParameter);
                        };
                        if (!foundCredentialsInParameter && !fileNameSuccessfullySet) {
                                throw "Format of provided parameter not valid\n2 Valid examples: 1. USE_CONFIG:yourfilename.json\n2. admin,,mypassword123,,http://192.168.178.33:8581";
                        };
                };
        };
        if (usePersistedConfiguration && !overwritePersistedConfig) {
                CONFIGURATION = await getPersistedObject(
                        getFilePath(configurationFileName),
                        CONFIGURATION_JSON_VERSION,
                        CONFIGURATION,
                        false
                        );
                log("Configuration " + configurationFileName + " is used! Trying to authenticate...");
        };
        timeFormatter.dateFormat = CONFIGURATION.dateFormat;
        initializeFonts();
        await initializeToken();
};

async function createAndShowWidget(homeBridgeStatus) {
        if (config.runsInAccessoryWidget) {
                await createAndShowLockScreenWidget(homeBridgeStatus);
        } else {
                let widget = new ListWidget();
                handleSettingOfBackgroundColor(widget);
                if (!config.runsWithSiri) {
                        await buildUsualGui(widget, homeBridgeStatus);
                } else if (config.runsWithSiri) {
                        await buildSiriGui(widget, homeBridgeStatus);
                };
                finalizeAndShowWidget(widget);
        };
};

async function createAndShowLockScreenWidget(homeBridgeStatus) {
        let widget = new ListWidget();
        handleSettingOfBackgroundColor(widget);
        overwriteSizesForLockScreen();
        await buildLockScreenWidgetHeader(widget);
        await buildLockScreenWidgetBody(widget, homeBridgeStatus);
        await widget.presentSmall();
        Script.setWidget(widget);
        Script.complete();
};

async function handleConfigPersisting() {
        if (usePersistedConfiguration || overwritePersistedConfig) {
                log("The valid configuration " + configurationFileName + " has been saved. Changes can only be applied if overwritePersistedConfig is set to true. Should be set to false after applying changes again!");
                persistObject(CONFIGURATION, getFilePath(configurationFileName));
        };
};

function buildStatusPanelInHeader(titleStack, homeBridgeStatus) {
        titleStack.addSpacer(CONFIGURATION.spacer_beforeFirstStatusColumn);
        let statusInfo = titleStack.addStack();
        let firstColumn = statusInfo.addStack();
        firstColumn.layoutVertically();
        addStatusInfo(firstColumn, homeBridgeStatus.overallStatus, CONFIGURATION.status_hbRunning);
        firstColumn.addSpacer(verticalSpacerInfoPanel);
        addStatusInfo(firstColumn, homeBridgeStatus.pluginsUpToDate, CONFIGURATION.status_pluginsUtd);

        statusInfo.addSpacer(CONFIGURATION.spacer_betweenStatusColumns);

        let secondColumn = statusInfo.addStack();
        secondColumn.layoutVertically();
        addStatusInfo(secondColumn, homeBridgeStatus.hbUpToDate, CONFIGURATION.status_hbUtd);
        secondColumn.addSpacer(verticalSpacerInfoPanel);
        addStatusInfo(secondColumn, homeBridgeStatus.nodeJsUpToDate, CONFIGURATION.status_nodejsUtd);

        titleStack.addSpacer(CONFIGURATION.spacer_afterSecondColumn);
};

async function showNotAvailableWidget() {
        if (!config.runsInAccessoryWidget) {
                let widget = new ListWidget();
                handleSettingOfBackgroundColor(widget);
                let mainStack = widget.addStack();
                await initializeLogoAndHeader(mainStack);
                addNotAvailableInfos(widget, mainStack);
                finalizeAndShowWidget(widget);
        } else {
                overwriteSizesForLockScreen();
                let widget = new ListWidget();
                handleSettingOfBackgroundColor(widget);
                await buildLockScreenWidgetHeader(widget);
                widget.addSpacer(2);
                addStyledText(
                        widget,
                        CONFIGURATION.error_noConnectionLockScreenText,
                        updatedAtFont
                );
                await widget.presentSmall();
                Script.setWidget(widget);
                Script.complete();
        };
};

async function finalizeAndShowWidget(widget) {
        if (!config.runsInWidget) {
        await widget.presentMedium();
};
Script.setWidget(widget);
Script.complete();
};

async function initializeToken() {
        token = await getAuthToken();
        if (token === undefined) {
        throw "Credentials not valid";
        };
};

async function initializeLogoAndHeader(titleStack) {
        titleStack.size = new Size(maxLineWidth, normalLineHeight);
        const logo = await getHbLogo();
        const imgWidget = titleStack.addImage(logo);
        imgWidget.imageSize = new Size(40, 30);

        let headerText = addStyledText(
        titleStack,
        CONFIGURATION.widgetTitle,
        headerFont
        );
        headerText.size = new Size(60, normalLineHeight);
};

function initializeFonts() {
        headerFont = Font.boldMonospacedSystemFont(CONFIGURATION.headerFontSize);
        infoFont = Font.systemFont(CONFIGURATION.informationFontSize);
        chartAxisFont = Font.systemFont(CONFIGURATION.chartAxisFontSize);
        updatedAtFont = Font.systemFont(CONFIGURATION.dateFontSize);
};

async function buildSiriGui(widget, homeBridgeStatus) {
        widget.addSpacer(10);
        let titleStack = widget.addStack();
        await initializeLogoAndHeader(titleStack);
        buildStatusPanelInHeader(titleStack, homeBridgeStatus);
        widget.addSpacer(10);
        let mainColumns = widget.addStack();
        mainColumns.size = new Size(maxLineWidth, 100);

        let verticalStack = mainColumns.addStack();
        verticalStack.layoutVertically();
        if (
                homeBridgeStatus.hbVersionInfos.updateAvailable ||
                homeBridgeStatus.pluginVersionInfos.updateAvailable ||
                homeBridgeStatus.nodeJsVersionInfos.updateAvailable
        ) {
                speakUpdateStatus(true);
                addStyledText(
                        verticalStack,
                        CONFIGURATION.siriGui_title_update_available,
                        infoFont
                );
                if (homeBridgeStatus.hbVersionInfos.updateAvailable) {
                        verticalStack.addSpacer(5);
                        addUpdatableElement(
                                verticalStack,
                                CONFIGURATION.bulletPointIcon +
                                homeBridgeStatus.hbVersionInfos.name + ": ",
                                homeBridgeStatus.hbVersionInfos.installedVersion,
                                homeBridgeStatus.hbVersionInfos.latestVersion
                        );
                };
                if (homeBridgeStatus.pluginVersionInfos.updateAvailable) {
                        for (plugin of homeBridgeStatus.pluginVersionInfos.plugins) {
                                if (CONFIGURATION.pluginsOrSwUpdatesToIgnore.includes(plugin.name)) {
                                        continue;
                                };
                                if (plugin.updateAvailable) {
                                        verticalStack.addSpacer(5);
                                        addUpdatableElement(
                                                verticalStack,
                                                CONFIGURATION.bulletPointIcon + plugin.name + ": ",
                                                plugin.installedVersion,
                                                plugin.latestVersion
                                        );
                                };
                        };
                };
                if (homeBridgeStatus.nodeJsVersionInfos.updateAvailable) {
                        verticalStack.addSpacer(5);
                        addUpdatableElement(
                                verticalStack,
                                CONFIGURATION.bulletPointIcon +
                                homeBridgeStatus.nodeJsVersionInfos.name + ": ",
                                homeBridgeStatus.nodeJsVersionInfos.currentVersion,
                                homeBridgeStatus.nodeJsVersionInfos.latestVersion
                        );
                };
        } else {
                speakUpdateStatus(false);
                verticalStack.addSpacer(30);
                addStyledText(verticalStack, CONFIGURATION.siriGui_title_all_UTD, infoFont);
        };
};

function speakUpdateStatus(updateAvailable) {
        if (CONFIGURATION.enableSiriFeedback) {
                if (updateAvailable) {
                        Speech.speak(CONFIGURATION.siri_spokenAnswer_update_available);
                } else {
                        Speech.speak(CONFIGURATION.siri_spokenAnswer_all_UTD);
                };
        };
};

async function buildUsualGui(widget, homeBridgeStatus) {
        widget.addSpacer(10);
          let titleStack = widget.addStack();
          await initializeLogoAndHeader(titleStack);
          buildStatusPanelInHeader(titleStack, homeBridgeStatus);
          widget.addSpacer(10);
          let cpuData = await fetchData(cpuUrl());
          let ramData = await fetchData(ramUrl());
          let usedRamText = getUsedRamString(ramData);
          let uptimesArray = await getUptimesArray();
          if (cpuData && ramData) {
                let mainColumns = widget.addStack();
                mainColumns.size = new Size(maxLineWidth, 77);
                mainColumns.addSpacer(4);

                let cpuColumn = mainColumns.addStack();
                cpuColumn.layoutVertically();
                addStyledText(
                        cpuColumn,
                        CONFIGURATION.title_cpuLoad +
                        getAsRoundedString(cpuData.currentLoad, 1) + "%",
                        infoFont
                );
                addChartToWidget(cpuColumn, cpuData.cpuLoadHistory);
                cpuColumn.addSpacer(7);

                let temperatureString = getTemperatureString(cpuData?.cpuTemperature.main);
                if (temperatureString) {
                        let cpuTempText = addStyledText(
                                cpuColumn,
                                CONFIGURATION.title_cpuTemp + temperatureString,
                                infoFont
                        );
                        cpuTempText.size = new Size(150, 30);
                        setTextColor(cpuTempText);
                };
        
                mainColumns.addSpacer(11);
        
                let ramColumn = mainColumns.addStack();
                ramColumn.layoutVertically();
                addStyledText(
                        ramColumn,
                        CONFIGURATION.title_ramUsage + usedRamText + "%",
                        infoFont
                );
                addChartToWidget(ramColumn, ramData.memoryUsageHistory);
                ramColumn.addSpacer(7);
        
                if (uptimesArray) {
                        let uptimesStack = ramColumn.addStack();
                        let upStack = uptimesStack.addStack();
                        addStyledText(upStack, CONFIGURATION.title_uptimes, infoFont);
                        let vertPointsStack = upStack.addStack();
                        vertPointsStack.layoutVertically();
        
                        addStyledText(
                                vertPointsStack,
                                CONFIGURATION.bulletPointIcon +
                                CONFIGURATION.title_systemGuiName +
                                uptimesArray[0],
                                infoFont
                        );
                        addStyledText(
                                vertPointsStack,
                                CONFIGURATION.bulletPointIcon +
                                CONFIGURATION.title_uiService +
                                uptimesArray[1],
                                infoFont
                        );
                };
                          
                widget.addSpacer(10);
        
                // Display last refresh timestamp
                let updatedAt = addStyledText(
                        widget,
                        "Last refreshed: " + timeFormatter.string(new Date()),
                        updatedAtFont
                );
                updatedAt.centerAlignText();
        };
};

async function buildLockScreenWidgetHeader(widget) {
        let mainStack = widget.addStack();
        const logo = await getHbLogo();
        const imgWidget = mainStack.addImage(logo);
        imgWidget.imageSize = new Size(14, 14);
        addStyledText(mainStack, CONFIGURATION.widgetTitle, headerFont);
};

async function buildLockScreenWidgetBody(widget, homeBridgeStatus) {
        let verticalStack = widget.addStack();
        verticalStack.layoutVertically();
        buildStatusPanelInHeader(verticalStack, homeBridgeStatus);
        await buildCpuRamInfoForLockScreen(verticalStack);
};

function overwriteSizesForLockScreen() {
        infoFont = Font.systemFont(7);
        infoPanelFont = Font.semiboldMonospacedSystemFont(7);
        iconSize = 8;
        CONFIGURATION.spacer_betweenStatusColumns = 2;
        CONFIGURATION.spacer_beforeFirstStatusColumn = 2;
        verticalSpacerInfoPanel = 1;
        timeFormatter.dateFormat = "HH:mm:ss";
        updatedAtFont = Font.systemFont(6);
};

async function buildCpuRamInfoForLockScreen(verticalStack) {
        let cpuData = await fetchData(cpuUrl());
        let ramData = await fetchData(ramUrl());

        verticalStack.addSpacer(CONFIGURATION.spacer_beforeFirstStatusColumn);
        let statusInfo = verticalStack.addStack();
        let cpuInfos = statusInfo.addStack();

        let cpuFirstColumn = cpuInfos.addStack();
        cpuFirstColumn.layoutVertically();
        addStyledText(cpuFirstColumn, "CPU:", infoFont);
        cpuInfos.addSpacer(2);

        let cpuSecondColumn = cpuInfos.addStack();
        cpuSecondColumn.layoutVertically();
        addStyledText(
                cpuSecondColumn,
                getAsRoundedString(cpuData.currentLoad, 1) + "%",
                infoFont
        );
        cpuSecondColumn.addSpacer(2);

        let temperatureString = getTemperatureString(cpuData?.cpuTemperature.main);
        if (temperatureString) {
                addStyledText(cpuSecondColumn, temperatureString, infoFont);
        };

        cpuInfos.addSpacer(17);

        let ramInfos = statusInfo.addStack();
        let usedRamText = getUsedRamString(ramData);

        let ramFirstColumn = cpuInfos.addStack();
        ramFirstColumn.layoutVertically();
        addStyledText(ramFirstColumn, "RAM:", infoFont);
        cpuInfos.addSpacer(2);
        ramFirstColumn.addSpacer(2);

        let ramSecondColumn = cpuInfos.addStack();
        ramSecondColumn.layoutVertically();
        addStyledText(ramSecondColumn, usedRamText + "%", infoFont);
        ramSecondColumn.addSpacer(5);

        addStyledText(
                ramSecondColumn,
                "Last refreshed: " + timeFormatter.string(new Date()),
                updatedAtFont
        );
};

function addUpdatableElement(
        stackToAdd,
        elementTitle,
        versionCurrent,
        versionLatest
) {
        let itemStack = stackToAdd.addStack();
        itemStack.addSpacer(17);
        addStyledText(itemStack, elementTitle, infoFont);

        let vertPointsStack = itemStack.addStack();
        vertPointsStack.layoutVertically();

        let versionStack = vertPointsStack.addStack();
        addStyledText(versionStack, versionCurrent, infoFont);
        versionStack.addSpacer(3);
        addIcon(
                versionStack,
                CONFIGURATION.siriGui_icon_version,
                new Color(CONFIGURATION.siriGui_icon_version_color)
        );
        versionStack.addSpacer(3);
        addStyledText(versionStack, versionLatest, infoFont);
};

function handleSettingOfBackgroundColor(widget) {
        if (!CONFIGURATION.adaptToLightOrDarkMode) {
                switch (CONFIGURATION.bgColorMode) {
                        case "CUSTOM":
                        widget.backgroundGradient = createLinearGradient(
                                CONFIGURATION.customBackgroundColor1_light,
                                CONFIGURATION.customBackgroundColor2_light
                        );
                        break;
                        case "BLACK_LIGHT":
                        widget.backgroundGradient = blackBgGradient_light;
                        break;
                        case "BLACK_DARK":
                        widget.backgroundGradient = blackBgGradient_dark;
                        break;
                        case "PURPLE_DARK":
                        widget.backgroundGradient = purpleBgGradient_dark;
                        break;
                        case "PURPLE_LIGHT":
                        default: 
                        widget.backgroundGradient = purpleBgGradient_light;
                };
          } else {
                switch (CONFIGURATION.bgColorMode) {
                case "CUSTOM":
                setGradient(
                        widget,
                        createLinearGradient(
                                CONFIGURATION.customBackgroundColor1_light,
                                CONFIGURATION.customBackgroundColor2_light
                        ),
                        createLinearGradient(
                                CONFIGURATION.customBackgroundColor1_dark,
                                CONFIGURATION.customBackgroundColor2_dark
                        )
                );
                break;
                case "BLACK_LIGHT":
                case "BLACK_DARK":
                setGradient(widget, blackBgGradient_light, blackBgGradient_dark);
                break;
                case "PURPLE_DARK":
                case "PURPLE_LIGHT":
                default:
                setGradient(widget, purpleBgGradient_light, purpleBgGradient_dark);
                };
        };
};

function setGradient(widget, lightOption, darkOption) {
        if (Device.isUsingDarkAppearance()) {
                widget.backgroundGradient = darkOption;
        } else {
                widget.backgroundGradient = lightOption;
        };
};

function getChartColorToUse() {
        if (CONFIGURATION.adaptToLightOrDarkMode && Device.isUsingDarkAppearance()) {
                return new Color(CONFIGURATION.chartColor_dark);
        } else {
                return new Color(CONFIGURATION.chartColor_light);
        };
};

function setTextColor(textWidget) {
        if (CONFIGURATION.adaptToLightOrDarkMode && Device.isUsingDarkAppearance()) {
                textWidget.textColor = new Color(CONFIGURATION.fontColor_dark);
        } else {
                textWidget.textColor = new Color(CONFIGURATION.fontColor_light);
        };
};

function createLinearGradient(color1, color2) {
        const gradient = new LinearGradient();
        gradient.locations = [0, 1];
        gradient.colors = [new Color(color1), new Color(color2)];
        return gradient;
};

function addStyledText(stackToAddTo, text, font) {
        let textHandle = stackToAddTo.addText(text);
        textHandle.font = font;
        setTextColor(textHandle);
        return textHandle;
};

function addChartToWidget(column, chartData) {
        let horizontalStack = column.addStack();
        horizontalStack.addSpacer(5);
        let yAxisLabelsStack = horizontalStack.addStack();
        yAxisLabelsStack.layoutVertically();

        addStyledText(
                yAxisLabelsStack,
                getMaxString(chartData, 2) + "%",
                chartAxisFont
        );
        yAxisLabelsStack.addSpacer(6);
        addStyledText(
                yAxisLabelsStack,
                getMinString(chartData, 2) + "%",
                chartAxisFont
        );
        yAxisLabelsStack.addSpacer(6);
        horizontalStack.addSpacer(2);

        let chartImage = new LineChart(500, 100, chartData)
        .configure((ctx, path) => {
                ctx.opaque = false;
                ctx.setFillColor(getChartColorToUse());
                ctx.addPath(path);
                ctx.fillPath(path);
        })
        .getImage();

        let vertChartImageStack = horizontalStack.addStack();
        vertChartImageStack.layoutVertically();

        let chartImageHandle = vertChartImageStack.addImage(chartImage);
        chartImageHandle.imageSize = new Size(100, 25);

        let xAxisStack = vertChartImageStack.addStack();
        xAxisStack.size = new Size(100, 10);

        addStyledText(xAxisStack, "t-10m", chartAxisFont);
        xAxisStack.addSpacer(75);
        addStyledText(xAxisStack, "t", chartAxisFont);
};

function checkIfConfigFileParameterIsProvided(givenParameter) {
        if (
                givenParameter.trim().startsWith("USE_CONFIG:") &&
                givenParameter.trim().endsWith(".json")
        ) {
                configurationFileName = givenParameter.trim().split("USE_CONFIG:")[1];
                if (!fileManager.fileExists(getFilePath(configurationFileName))) {
                        throw (
                                "Config file with provided name " +
                                configurationFileName +
                                " does not exist!\nCreate it first by running the script once providing the name in variable configurationFileName and maybe with variable overwritePersistedConfig set to true"
                        );
                };
                return true;
        };
        return false;
};

function useCredentialsFromWidgetParameter(givenParameter) {
        if (givenParameter.includes(",,")) {
                let credentials = givenParameter.split(",,");
                if (
                        credentials.length === 3 &&
                        credentials[0].length > 0 &&
                        credentials[1].length > 0 &&
                        credentials[2].length > 0 &&
                        credentials[2].startsWith("http")
                ) {
                        CONFIGURATION.userName = credentials[0].trim();
                        CONFIGURATION.password = credentials[1].trim();
                        CONFIGURATION.hbServiceMachineBaseUrl = credentials[2].trim();
                        return true;
                };
        };
        return false;
};

async function getAuthToken() {
        if (
                CONFIGURATION.hbServiceMachineBaseUrl ===
                ">enter the ip with the port <"
        ) {
                throw "Base URL to machine not entered! Edit variable called hbServiceMachineBaseUrl";
        };
        let req = new Request(noAuthUrl());
        req.timeoutInterval = CONFIGURATION.requestTimeoutInterval;
        const headers = {
                accept: "*/*",
                "Content-Type": "application/json",
        };
        req.method = "POST";
        req.headers = headers;
        req.body = JSON.stringify({});
        let authData;
        try {
                authData = await req.loadJSON();
        } catch (e) {
                return UNAVAILABLE;
        };
        if (authData.access_token) {
                return authData.access_token;
        };

        req = new Request(authUrl());
        req.timeoutInterval = CONFIGURATION.requestTimeoutInterval;
        let body = {
                username: CONFIGURATION.userName,
                password: CONFIGURATION.password,
                otp: "string",
        };
        req.body = JSON.stringify(body);
        req.method = "POST";
        req.headers = headers;
        
        try {
                authData = await req.loadJSON();
        } catch (e) {
                return UNAVAILABLE;
        };
        return authData.access_token;
};

async function fetchData(url) {
        let req = new Request(url);
        req.timeoutInterval = CONFIGURATION.requestTimeoutInterval;
        let headers = {
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
        };
        req.headers = headers;
        let result;
        try {
                result = req.loadJSON();
        } catch (e) {
                return undefined;
        };
        return result;
};

async function getOverallStatus() {
        const statusData = await fetchData(overallStatusUrl());
        if (statusData === undefined) {
                return undefined;
        };
        return statusData.status === "up";
};

async function getHomebridgeVersionInfos() {
        if (CONFIGURATION.pluginsOrSwUpdatesToIgnore.includes("HOMEBRIDGE_UTD")) {
                log(
                        "You configured Homebridge to not be checked for updates. Widget will show that it's UTD!"
                );
                return {
                        updateAvailable: false 
                };
        };
        const hbVersionData = await fetchData(hbVersionUrl());
        if (hbVersionData === undefined) {
                return undefined;
        };
        return hbVersionData;
};

async function getNodeJsVersionInfos() {
        if (CONFIGURATION.pluginsOrSwUpdatesToIgnore.includes("NODEJS_UTD")) {
                log(
                        "You configured Node.js to not be checked for updates. Widget will show that it's UTD!"
                );
                return {
                        updateAvailable: false 
                };
        };
        const nodeJsData = await fetchData(nodeJsUrl());
        if (nodeJsData === undefined) {
                return undefined;
        };
        nodeJsData.name = "node.js";
        return nodeJsData;
};

async function getPluginVersionInfos() {
        const pluginsData = await fetchData(pluginsUrl());
        if (pluginsData === undefined) {
                return undefined;
        };
        for (plugin of pluginsData) {
                if (CONFIGURATION.pluginsOrSwUpdatesToIgnore.includes(plugin.name)) {
                        log("You configured " + plugin.name + " to not be checked for updates. Widget will show that it's UTD!");
                continue;
                };
                if (plugin.updateAvailable) {
                        return {
                                plugins: pluginsData, updateAvailable: true 
                        };
                };
        };
        return {
                plugins: pluginsData, updateAvailable: false 
        };
};

function getUsedRamString(ramData) {
        if (ramData === undefined) return "unknown";
        return getAsRoundedString(100 - (100 * ramData.mem.available) / ramData.mem.total,2);
};

async function getUptimesArray() {
        const uptimeData = await fetchData(uptimeUrl());
        if (uptimeData === undefined) return undefined;
        return [
                formatSeconds(uptimeData.time.uptime),
                formatSeconds(uptimeData.processUptime),
        ];
};

function formatSeconds(value) {
        if (value > 60 * 60 * 24 * 10) {
                return getAsRoundedString(value / 60 / 60 / 24, 0) + "d"; 
        } else if (value > 60 * 60 * 24) {
                return getAsRoundedString(value / 60 / 60 / 24, 1) + "d";
        } else if (value > 60 * 60) {
                return getAsRoundedString(value / 60 / 60, 1) + "h";
        } else if (value > 60) {
                return getAsRoundedString(value / 60, 1) + "m";
        } else {
                return getAsRoundedString(value, 1) + "s";
        };
};

async function loadImage(imgUrl) {
        let req = new Request(imgUrl);
        req.timeoutInterval = CONFIGURATION.requestTimeoutInterval;
        let image = await req.loadImage();
        return image;
};

async function getHbLogo() {
        let path = getFilePath(CONFIGURATION.hbLogoFileName);
        if (fileManager.fileExists(path)) {
                const fileDownloaded = await fileManager.isFileDownloaded(path);
                if (!fileDownloaded) {
                        await fileManager.downloadFileFromiCloud(path);
                };
        return fileManager.readImage(path);
        } else {
                const logo = await loadImage(CONFIGURATION.logoUrl);
                fileManager.writeImage(path, logo);
                return logo;
        };
};

function getFilePath(fileName) {
        let dirPath = fileManager.joinPath(
                fileManager.documentsDirectory(),
                "homebridgeStatus"
        );
        if (!fileManager.fileExists(dirPath)) {
                fileManager.createDirectory(dirPath);
        }
        return fileManager.joinPath(dirPath, fileName);
};

function addNotAvailableInfos(widget, titleStack) {
        let statusInfo = titleStack.addText("                                                 ");
        setTextColor(statusInfo);
        statusInfo.size = new Size(150, normalLineHeight);
        let errorText = widget.addText(CONFIGURATION.error_noConnectionText);
        errorText.size = new Size(410, 130);
        errorText.font = infoFont;
        setTextColor(errorText);

        widget.addSpacer(15);
        let updatedAt = widget.addText("Last refreshed: " + timeFormatter.string(new Date()));
        updatedAt.font = updatedAtFont;
        setTextColor(updatedAt);
        updatedAt.centerAlignText();

        return widget;
};

function getAsRoundedString(value, decimals) {
        let factor = Math.pow(10, decimals);
        return (Math.round((value + Number.EPSILON) * factor) / factor)
        .toString()
        .replace(".", CONFIGURATION.decimalChar);
};

function getMaxString(arrayOfNumbers, decimals) {
        let factor = Math.pow(10, decimals);
        return (Math.round((Math.max(...arrayOfNumbers) + Number.EPSILON) * factor) / factor)
        .toString()
        .replace(".", CONFIGURATION.decimalChar);
};

function getMinString(arrayOfNumbers, decimals) {
        let factor = Math.pow(10, decimals);
        return (
                Math.round((Math.min(...arrayOfNumbers) + Number.EPSILON) * factor) / factor
        )
        .toString()
        .replace(".", CONFIGURATION.decimalChar);
};

function getTemperatureString(temperatureInCelsius) {
        if (temperatureInCelsius === undefined || temperatureInCelsius < 0)
        return undefined;

        if (CONFIGURATION.temperatureUnitConfig === "CELSIUS") {
                return getAsRoundedString(temperatureInCelsius, 1) + "°C";
        } else {
                return (getAsRoundedString(convertToFahrenheit(temperatureInCelsius), 1) + "°F");
        };
};

function convertToFahrenheit(temperatureInCelsius) {
        return (temperatureInCelsius * 9) / 5 + 32;
};

function addStatusIcon(widget, statusBool) {
  let name = "";
  let color;
  if (statusBool === undefined) {
    name = CONFIGURATION.icon_statusUnknown;
    color = new Color(CONFIGURATION.icon_colorUnknown);
  } else if (statusBool) {
    name = CONFIGURATION.icon_statusGood;
    color = new Color(CONFIGURATION.icon_colorGood);
  } else {
    name = CONFIGURATION.icon_statusBad;
    color = new Color(CONFIGURATION.icon_colorBad);
  }
  addIcon(widget, name, color);
}

function addStatusInfo(lineWidget, statusBool, shownText) {
  let itemStack = lineWidget.addStack();
  addStatusIcon(itemStack, statusBool);
  itemStack.addSpacer(2);
  let text = itemStack.addText(shownText);
  text.font = infoPanelFont;
  setTextColor(text);
}

async function handleNotifications(hbRunning, hbUtd, pluginsUtd, nodeUtd) {
  if (!CONFIGURATION.notificationEnabled) {
    return;
  }
  let path = getFilePath(CONFIGURATION.notificationJsonFileName);
  let state = await getPersistedObject(
    path,
    NOTIFICATION_JSON_VERSION,
    INITIAL_NOTIFICATION_STATE,
    true
  );
  let now = new Date();
  let shouldUpdateState = false;
  if (
    shouldNotify(
      hbRunning,
      state.hbRunning.status,
      state.hbRunning.lastNotified
    )
  ) {
    state.hbRunning.status = hbRunning;
    state.hbRunning.lastNotified = now;
    shouldUpdateState = true;
    scheduleNotification(CONFIGURATION.notifyText_hbNotRunning);
  } else if (hbRunning && !state.hbRunning.status) {
    state.hbRunning.status = hbRunning;
    state.hbRunning.lastNotified = undefined;
    shouldUpdateState = true;
    if (!CONFIGURATION.disableStateBackToNormalNotifications) {
      scheduleNotification(CONFIGURATION.notifyText_hbNotRunning_backNormal);
    }
  }

  if (shouldNotify(hbUtd, state.hbUtd.status, state.hbUtd.lastNotified)) {
    state.hbUtd.status = hbUtd;
    state.hbUtd.lastNotified = now;
    shouldUpdateState = true;
    scheduleNotification(CONFIGURATION.notifyText_hbNotUtd);
  } else if (hbUtd && !state.hbUtd.status) {
    state.hbUtd.status = hbUtd;
    state.hbUtd.lastNotified = undefined;
    shouldUpdateState = true;
    if (!CONFIGURATION.disableStateBackToNormalNotifications) {
      scheduleNotification(CONFIGURATION.notifyText_hbNotUtd_backNormal);
    }
  }

  if (
    shouldNotify(
      pluginsUtd,
      state.pluginsUtd.status,
      state.pluginsUtd.lastNotified
    )
  ) {
    state.pluginsUtd.status = pluginsUtd;
    state.pluginsUtd.lastNotified = now;
    shouldUpdateState = true;
    scheduleNotification(CONFIGURATION.notifyText_pluginsNotUtd);
  } else if (pluginsUtd && !state.pluginsUtd.status) {
    state.pluginsUtd.status = pluginsUtd;
    state.pluginsUtd.lastNotified = undefined;
    shouldUpdateState = true;
    if (!CONFIGURATION.disableStateBackToNormalNotifications) {
      scheduleNotification(CONFIGURATION.notifyText_pluginsNotUtd_backNormal);
    }
  }

  if (shouldNotify(nodeUtd, state.nodeUtd.status, state.nodeUtd.lastNotified)) {
    state.nodeUtd.status = nodeUtd;
    state.nodeUtd.lastNotified = now;
    shouldUpdateState = true;
    scheduleNotification(CONFIGURATION.notifyText_nodejsNotUtd);
  } else if (nodeUtd && !state.nodeUtd.status) {
    state.nodeUtd.status = nodeUtd;
    state.nodeUtd.lastNotified = undefined;
    shouldUpdateState = true;
    if (!CONFIGURATION.disableStateBackToNormalNotifications) {
      scheduleNotification(CONFIGURATION.notifyText_nodejsNotUtd_backNormal);
    }
  }

  if (shouldUpdateState) {
    persistObject(state, path);
  }
}

function shouldNotify(currentBool, boolFromLastTime, lastNotifiedDate) {
  return (
    !currentBool && (boolFromLastTime || isTimeToNotifyAgain(lastNotifiedDate))
  );
}

function isTimeToNotifyAgain(dateToCheck) {
  if (dateToCheck === undefined) return true;

  let dateInThePast = new Date(dateToCheck);
  let now = new Date();
  let timeBetweenDates = parseInt(
    (now.getTime() - dateInThePast.getTime()) / 1000
  ); // Seconds
  return (
    timeBetweenDates > CONFIGURATION.notificationIntervalInDays * 24 * 60 * 60
  );
}

function scheduleNotification(text) {
  let not = new Notification();
  not.title = CONFIGURATION.notification_title;
  not.body = text;
  not.addAction(
    CONFIGURATION.notification_expandedButtonText,
    CONFIGURATION.hbServiceMachineBaseUrl,
    false
  );
  not.sound = CONFIGURATION.notification_ringTone;
  not.schedule();
}

async function getPersistedObject(
  path,
  versionToCheckAgainst,
  initialObjectToPersist,
  createIfNotExisting
) {
  if (fileManager.fileExists(path)) {
    const fileDownloaded = await fileManager.isFileDownloaded(path);
    if (!fileDownloaded) {
      await fileManager.downloadFileFromiCloud(path);
    }
    let raw, persistedObject;
    try {
      raw = fileManager.readString(path);
      persistedObject = JSON.parse(raw);
    } catch (e) {
      fileManager.remove(path);
    }

    if (
      persistedObject &&
      (persistedObject.jsonVersion === undefined ||
        persistedObject.jsonVersion < versionToCheckAgainst)
    ) {
      log(
        "Unfortunately, the configuration structure changed and your old config is not compatible anymore. It is now renamed, marked as deprecated and a new one is created with the initial configuration. "
      );
      persistObject(
        persistedObject,
        getFilePath("DEPRECATED_" + configurationFileName)
      );
      fileManager.remove(path);
      let migratedConfig = { ...initialObjectToPersist, ...persistedObject };
      migratedConfig.jsonVersion = CONFIGURATION_JSON_VERSION;
      persistObject(migratedConfig, path);
      return migratedConfig;
    } else {
      return persistedObject;
    }
  }
  if (createIfNotExisting) {
    // Create a new state JSON
    persistObject(initialObjectToPersist, path);
  }
  return initialObjectToPersist;
}


function persistObject(object, path) {
  let raw = JSON.stringify(object, null, 2);
  fileManager.writeString(path, raw);
}

function addIcon(widget, name, color) {
  let sf = SFSymbol.named(name);
  let iconImage = sf.image;
  let imageWidget = widget.addImage(iconImage);
  imageWidget.resizable = true;
  imageWidget.imageSize = new Size(iconSize, iconSize);
  imageWidget.tintColor = color;
}
