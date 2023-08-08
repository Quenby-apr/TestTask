const { expect, test } = require('@jest/globals');
const dotenv = require('dotenv');
dotenv.config();
const request = require('supertest');
const host = process.env.HOST;
const port = process.env.PORT;


test('Получение одиночного сообщения, лежащего в очереди', async () => {
    const myMessage = {
        "message": "alone message"
    }
    sendMessage(myMessage, "queue")

    const response = await getMessage("queue")

    expect(response.body).toEqual(myMessage);
})

test('Получение одиночного сообщения, отправленного в очередь', async () => {
    const responsePromise = getMessage("queue")
    const myMessage = {
        "message": "alone message"
    }
    sendMessage(myMessage, "queue")
    const response = await responsePromise;
    expect(response.body).toEqual(myMessage);
})

test('Порядок получения сообщений', async () => {
    const responsePromise1 = getMessageTime("queue", 30)
    const responsePromise2 = getMessageTime("queue", 30)
    const responsePromise3 = getMessageTime("queue", 30)

    const myMessage = {
        "message": "alone message"
    }
    for (let i = 0; i < 3; i++) {
        sendMessage(myMessage, "queue");
    }

    const responseTime1 = await responsePromise1
    const responseTime2 = await responsePromise2
    const responseTime3 = await responsePromise3

    expect(responseTime1 < responseTime2).toBeTruthy();
    expect(responseTime2 < responseTime3).toBeTruthy();
})

test('Превышение таймаута', async () => {
    const responsePromise = getMessage("queue", 4)
    const myMessage = {
        "message": "alone message"
    }

    setTimeout(() => {
        sendMessage(myMessage, "queue");
    }, 6000);

    const response = await responsePromise;
    expect(response.status).toBe(404);
})

async function sendMessage(message, queueName) {
    return await request(`${host}:${port}/queue`)
        .put(`/${queueName}`)
        .set('Content-type', 'application/json')
        .send(message)
}

async function getMessage(queueName, timeout = -1) {
    if (timeout === -1) {
        return await request(`${host}:${port}`)
            .get(`/queue/${queueName}`)
    }
    else {
        return await request(`${host}:${port}`)
            .get(`/queue/${queueName}?timeout=${timeout}`)
    }
}

async function getMessageTime(queueName, timeout = -1) {
    if (timeout === -1) {
        await request(`${host}:${port}`)
            .get(`/queue/${queueName}`)
        return Date.now();
    }
    else {
        await request(`${host}:${port}`)
            .get(`/queue/${queueName}?timeout=${timeout}`)
        return Date.now();
    }
}