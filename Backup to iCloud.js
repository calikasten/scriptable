// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: cloud;

// Set  variables
iCloud = FileManager.iCloud();
directory = iCloud.documentsDirectory();
const folderName = "Script Backups";
const folderLocation = `/${folderName}`;
const directoryPath = `${directory}${folderLocation}`;

// Create new directory location for script backups
iCloud.createDirectory(directoryPath, true);
let runBackup = iCloud.listContents(directory);
// Count number of scripts backed up to directory
let count = 0;
// For each item found in the directory, perform script backup function
runBackup.forEach(backupScript);

// Begin script backup function
function backupScript(item, index) {
  var ext = iCloud.fileExtension(directory + "/" + item);
  if (ext == "js") {
  	let file = iCloud.read(directory + "/" + item);
  	iCloud.write(directoryPath + "/" + item, file);
  	count++;
  }
}
Script.complete();

// Display confirmation dialogue alert for successful backup
const dialogue = new Alert();
dialogue.addAction("OK");
dialogue.title = "Success";
dialogue.message = `${count} scripts backed up to iCloud.`;
dialogue.present();
