const IPFS = require('ipfs')
const fs = require('fs');

async function main () {
  const node = await IPFS.create()
  const version = await node.version()

  console.log('Version:', version.version)

  let testFile = fs.readFileSync("/home/chin/Desktop/project/fabric-samples/filesharing/apiClient/hello.txt");
  let testBuffer = Buffer.from(testFile);

try{
  const filesAdded = await node.add({
    path: testFile,
    content: testBuffer
  })
  console.log('Added file:', filesAdded[0].path, filesAdded[0].hash)
}catch(error){
    console.log('That did not go well.')
  throw error
}

}

main()





