// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: cloud;
ab = FileManager.iCloud()
dir=ab.documentsDirectory()

const now = new Date()
const bDirName = "Script Backups"
const backupTo = `/${bDirName}`
const newDirName = `${dir}${backupTo}`

ab.createDirectory(newDirName,true)

let a = ab.listContents(dir)

// Provide a container for the script count
let count = 0
// For each item found in the directory, perform myFunction
a.forEach(myFunction)

let aa = new Alert()
aa.addAction("OK")
aa.title = "Success"
aa.message = `${count} scripts backed up to iCloud.`
aa.present()
Script.complete()

// Begin functions
function myFunction(item, index){
  var ext = (ab.fileExtension(dir+"/"+item))
  if (ext == "js")
  {
    let file = ab.read(dir+"/"+item)
    ab.write(newDirName+"/"+item, file)
    count++
  }
};
