// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: file-code;
// share-sheet-inputs: file-url, url, plain-text;
// Trigger this script via the share sheet with a URL input.
let url = args.urls[0]
let fileURL = args.fileURLs[0]
let text = args.plainTexts[0]
if (url != null) {
  // Load the JSON from a URL input.
  let r = new Request(url)
  let json = await r.loadJSON()
  await input(json)
} else if (fileURL != null) {
  // Load the JSON from a file URL input and parse it into an object. 
  let fm = FileManager.local()
  let text = fm.readString(fileURL)
  await parseAndPrompt(text)
} else if (text != null) {
  // Load plain text input and parse it into an object.
  await parseAndPrompt(text)
} else {
  // Error for invalid input.
  let alert = new Alert()
  alert.title = "No valid input"
  alert.message = "There was no URL or text argument provided."
  alert.addCancelAction("OK")
  await alert.present()
}

async function parseAndPrompt(text) {
  let json = JSON.parse(text)
  if (json != null) {
    await input(json)
  } else {
    let alert = new Alert()
    alert.title = "Invalid JSON"
    alert.message = "The string could not be parsed to JSON."
    await alert.present()
  }
}

async function input(json) {
    await prettyPrint(json)
} 

async function prettyPrint(json) {
  let str = JSON.stringify(json, null, 2)
  await QuickLook.present(str)
}