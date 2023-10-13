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
  let request = new Request(url)
  let json = await request.loadJSON()
  await input(json)
} else if (fileURL != null) {
  // Load the JSON from a file URL input and parse it into an object. 
  let fileManager = FileManager.local()
  let text = fileManager.readString(fileURL)
  await parseAndPrompt(text)
} else if (text != null) {
  // Load plain text input and parse it into an object.
  await parseAndPrompt(text)
} else {
  // Error for invalid input.
  let alert = new Alert()
  alert.title = "No valid input provided."
  alert.addCancelAction("OK")
  await alert.present()
}

async function input(json) {
    await prettyPrint(json)
} 

async function prettyPrint(json) {
  let str = JSON.stringify(json, null, 2)
  await QuickLook.present(str)
}