const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const{S3Client, PutObjectCommand} = require('@aws-sdk/client-s3')
const mime = require('mime-types')
const Redis = require('ioredis')

const publisher = new Redis('')

function publishLog(log) {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({log}))
}

const s3Client = new S3Client({
    region: 'ca-central-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const PROJECT_ID = process.env.PROJECT_ID

async function init() {
    console.log("Executing init in script.js")
    publishLog('Started build')
    const outDirPath = path.join(__dirname, 'output')

    // install npm in the outDirPath and run it
    const p = exec(`cd ${outDirPath} && npm install && npm run build`)

    p.stdout.on('data', function(data) {
        console.log(data.toString())
        publishLog(data.toString())
    })

    p.stdout.on('error', function(data) {
        console.log('Error',data.toString())
        publishLog(`Error: ${data.toString()}`)
    })

    p.on(close, async function() {
        console.log('Build Complete')
        publishLog('Completed Build')
        // after building npm, a dist folder is created, need to use that
        const distFolderPath = path.join(__dirname, 'output', 'dist')
        const distFolderContent = fs.readdirSync(distFolderPath, {recursive: true})

        publishLog('Upload starting')
        for (const file of distFolderContent) {
            const filePath = path.join(distFolderPath,file)
            // if folder detected skip, just need to uplaod the file not the folders
            if (fs.lstatSync(filePath).isDirectory()) continue;

            publishLog(`Uploading at ${file}`)
            console.log('Uploading', filePath)

            const command = new PutObjectCommand({
                // enter the name of the s3 bucket created on AWS
                Bucket:'vercel-clone',
                Key: `outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                // need to give content type
                // type can be dynamic so for that use mime
                ContentType: mime.lookup(filePath)

            })

            // objects start uploading into s3 bucket
            await s3Client.send(command)

            publishLog(`Uploaded ${file}`)
            console.log('Uploaded', filePath)
        }

        publishLog('Done')
        console.log('Done')
    }) 
    // the above three are event listeners for writing errors, or logs onto the console
}

// call the init function
init()