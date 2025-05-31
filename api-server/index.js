const express = require('express')
const {generateSlug} = require('random-word-slugs')
const {ECSClient, RunTaskCommand, ECSClient} = require('@aws-sdk/client-ecs')
const {Server} = require('socket.io')
const Redis = require('ioredis')

const app = express()
const PORT = 9000

const subscriber = new Redis('')
const io = new Server({ cors: '*'})

// user asks the server to subscribe to the relevant channel
io.on('connection', socket => {
    socket.on('subscribe', channel => {
        socket.join(channel)
        socket.emit('message', `Joined ${channel}`)
    })
})

io.listen(9001, () => console.log('Socket Server for subscribing running on port 9001 '))


const ecsClient = new ECSClient({
    region: 'ca-central-1',
    credentials : {
        accessKey : '',
        secretAccessKey : ''
    }
})

// need to cluster and task ARN to load the URL into ECS
const config = {
    CLUSTER: '',
    TASK: ''
}

app.use(express.json())

app.post('/project', async (req, res) => {
    const {gitURL, slug} = req.body
    const projectSlug = slug? slug:generateSlug()

    // run a container on ecs
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image',
                    environment: [
                        {name: 'GIT_REPOSITORY_URL', value: gitURL},
                        {name: 'PROJECT_ID', value: projectSlug}
                    ]
                }
            ]
        },
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: ['','',''],
                securityGroups: ['']
            }
        }
    })
    await ecsClient.send(command);
    return res.json({status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8000`}})
})

// this functions gives the logs back the to user by selecting the relevant logs of a pattern
async function initRedisSubscribe() {
    subscriber.psubscribie('logs:*')
    subscriber.on('pmessage', (pattern, channel, message) => {
        io.to(channel).emit('message', message)
    })
}

app.listen(PORT, () => console.log(`API server initalized on port  ${PORT}`))
