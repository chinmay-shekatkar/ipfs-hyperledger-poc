const ipfsAPI = require('ipfs-api');
const express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
const fs = require('fs');
const app = express();
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');
const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpPathAlice = path.resolve(__dirname, 'connection2.json');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//Connceting to the ipfs network via infura gateway
const ipfs = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'})

app.post('/registerUser/', async function (req, res) {

    
  var userName = req.body.Username;
  var passWord = req.body.Password;
  var organization= req.body.Organization;

  try {


      var con = mysql.createConnection({
          host: "localhost",
          user: "root",
          password: "2121",
          database: "files"
        });

      con.connect(function(err) {
          if (err) throw err;
          console.log("Connected to users database");
          var sql = `INSERT INTO usercredentials1 VALUES ('${userName}', '${passWord}','${organization}');`;
          con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
          });
        });

 
      if(organization==="bob"){
        
      // Create a new file system based wallet for managing identities.
      const walletPath = path.join(process.cwd(), 'wallet');
     

      const wallet = new FileSystemWallet(walletPath);
      console.log(`Wallet path: ${walletPath}`);
      
      // Check to see if we've already enrolled the user.
      const userExists = await wallet.exists(userName);
      if (userExists) {
          console.log(`An identity for the user ${userName} already exists in the wallet`);
          return;
      }

      // Check to see if we've already enrolled the admin user.
      const adminExists = await wallet.exists('admin');
      if (!adminExists) {
          console.log('An identity for the admin user "admin" does not exist in the wallet');
          console.log('Run the enrollAdmin.js application before retrying');
          return;
      }

      // Create a new gateway for connecting to our peer node.
      const gateway = new Gateway();
      await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

      // Get the CA client object from the gateway for interacting with the CA.
      const ca = gateway.getClient().getCertificateAuthority();
      const adminIdentity = gateway.getCurrentIdentity();

      // Register the user, enroll the user, and import the new identity into the wallet.
      const secret = await ca.register({ enrollmentID: userName , role: 'client' }, adminIdentity);
      const enrollment = await ca.enroll({ enrollmentID: userName, enrollmentSecret: secret });
      const userIdentity = X509WalletMixin.createIdentity('bob', enrollment.certificate, enrollment.key.toBytes());
      await wallet.import( req.body.Username, userIdentity);
      console.log(`Successfully registered and enrolled bob user ${userName} and imported it into the wallet`);
      console.log(req.body.Password);
      console.log(req.body.selectpicker);

      res.redirect('http://localhost:3000/success');

      }
    
     if(organization==="alice"){
        
            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
     

            const wallet = new FileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);
            
            // Check to see if we've already enrolled the user.
            const userExists = await wallet.exists(userName);
            if (userExists) {
                console.log(`An identity for the user ${userName} already exists in the wallet`);
                return;
            }
    
            // Check to see if we've already enrolled the admin user.
            const adminExists = await wallet.exists('adminAlice');
            if (!adminExists) {
                console.log('An identity for the admin user "admin" does not exist in the wallet');
                console.log('Run the enrollAdmin.js application before retrying');
                return;
            }
    
            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccpPathAlice, { wallet, identity: 'adminAlice', discovery: { enabled: true, asLocalhost: true } });
    
            // Get the CA client object from the gateway for interacting with the CA.
            const ca = gateway.getClient().getCertificateAuthority();
            const adminIdentity = gateway.getCurrentIdentity();
    
            // Register the user, enroll the user, and import the new identity into the wallet.
            const secret = await ca.register({ enrollmentID: userName , role: 'client' }, adminIdentity);
            const enrollment = await ca.enroll({ enrollmentID: userName, enrollmentSecret: secret });
            const userIdentity = X509WalletMixin.createIdentity('alice', enrollment.certificate, enrollment.key.toBytes());
            await wallet.import( req.body.Username, userIdentity);
            console.log(`Successfully registered and enrolled alice user ${userName} and imported it into the wallet`);
            console.log(req.body.Password);
            console.log(req.body.selectpicker);
    
            res.redirect('http://localhost:3000/success');
        }

      console.log("try block end");

  } catch (error) {
      console.error(`Failed to register user ${userName} : ${error}`);
      process.exit(1);
  }
})


//Addfile router for adding file a local file to the IPFS network without any local node
app.post('/addfile', function(req, res) {

    var fileNamee = req.body.fileName;
    var fileExtention = req.body.fileExtention;
    var fileOwnerr = req.body.fileOwner;
    var passkey = req.body.password;
    console.log(fileNamee)
    //Reading file from computer
    try{
      var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "2121",
        database: "files"
      });
      var pass='';
       con.connect( async function(err) {
        console.log("Connection established!")
        if (err) throw err;
        con.query(`SELECT password FROM usercredentials1 WHERE username = '${fileOwnerr}'`,async function (err, result) {
          if (err) throw err;
          
          pass = result[0].password;
          console.log(result[0].password);
          console.log(passkey);
          console.log(passkey.localeCompare(pass));
          
          if(passkey.localeCompare(pass)){
            console.log("this is in if block")
            console.log("Wrong password for user. Transaction not processed please re-try.")
          }else{
            const sharefilepath = path.join(process.cwd(),'share');
            let testFile = fs.readFileSync(`/${sharefilepath}/${fileNamee}`);

            //Creating buffer for ipfs function to add file to the system
            let testBuffer = Buffer.from(testFile);
            try{
           await ipfs.files.add(testBuffer, async function (err, file) {
                if (err) {
                  console.log(err);
                }
                console.log(file)
                console.log(file[0].hash)
                var fileHash = file[0].hash;
            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), 'wallet');
            const wallet = new FileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);
      
            // Check to see if we've already enrolled the user.
            const userExists = await wallet.exists(`${fileOwnerr}`);
            if (!userExists) {
                console.log(`An identity for the user ${fileOwnerr} does not exist in the wallet`);
                console.log('Run the registerUser.js application before retrying');
                return;
            }
      
            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccpPath, { wallet, identity: `${fileOwnerr}`, discovery: { enabled: true, asLocalhost: true } });
      
            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork('sharechannelv1');
      
            // Get the contract from the network.
            const contract = network.getContract('ipfs1');
            await contract.submitTransaction('initFile', `${fileHash}`, `${fileNamee}`, `${fileExtention}`, `${fileOwnerr}`);
            console.log('Transaction has been submitted');
            res.write('Transaction has been submitted '+'file hash is: '+ fileHash );
            res.end();
      
            // Disconnect from the gateway.
            await gateway.disconnect();
              })
              


            }catch(error){
              console.error(`Failed to submit transaction: ${error}`);
            }
             


          
 }
 });
});
} catch(error){
          console.error(`Failed to submit transaction: ${error}`);
          process.exit(1)
        }
});

app.get('/upload', async function (req, res) { 

    res.sendFile(path.join(__dirname+'/html pages/upload.html'));
  
  });

  app.get('/success', async function (req, res) { 

    res.sendFile(path.join(__dirname+'/html pages/success.html'));
  
  });

//Getting the uploaded file via hash code.
app.get('/getfile', function(req, res) {
    res.sendFile(path.join(__dirname+'/html pages/hash.html'));
})

app.post('/hash', function(req,res){

         var fileHashh = req.body.fileHash;
        //This hash is returned hash of addFile router.
        const validCID = fileHashh;

        ipfs.files.get(validCID, function (err, files) {
            files.forEach((file) => {
              console.log(file.path)
              console.log(file.content.toString('utf8'))
              res.write('This is the File content: ' + file.content.toString('utf8') + 'download file at: gateway.ipfs.io/ipfs/'+file.path);
              res.end();
              //res.send(file.content.toString('utf8'));
            })
          })
          
});

app.get('/register', function(req,res){
  res.sendFile(path.join(__dirname+'/html pages/register.html'));
});


app.get('/', function(req,res){
  res.sendFile(path.join(__dirname+'/html pages/dash.html'));
});

app.listen(3000, () => console.log('App listening on port 3000!'))

//gateway.ipfs.io/ipfs/QmQ3bmJqpb7n7MDTaCT7AV1QXUnMeBRc6Cz8Gvk2JcEDWD
//ipfs.infura.io