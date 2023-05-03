// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: cloud;
iCloud = FileManager.iCloud()
directory = iCloud.documentsDirectory()
​
const now = new Date()
const directoryName = "Script Backups"
const backupLocation = `/${directoryName}`
const newDirectoryName = `${directory}${backupLocation}`
​
// Create new directory location for script backups
iCloud.createDirectory(newDirectoryName,true)
	let runBackup = iCloud.listContents(directory)
	// Count number of scripts backed up to directory
	let count = 0
	// For each item found in the directory, perform script backup function
	runBackup.forEach(backupScript)
​
// Begin script backup function
function backupScript(item, index){
  var ext = (iCloud.fileExtension(directory+"/"+item))
  if (ext == "js")
  {
    let file = iCloud.read(directory+"/"+item)
    iCloud.write(newDirectoryName+"/"+item, file)
    count++
  }
}
Script.complete();
​
// Display confirmation dialogue alert for successful backup
let dialogue = new Alert()
	dialogue.addAction("OK")
	dialogue.title = "Success"
	dialogue.message = `${count} scripts backed up to iCloud.`
	dialogue.present()
