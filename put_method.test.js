const { expect, test } = require('@jest/globals');
const asyncLib = require('async');
const dotenv = require('dotenv');
dotenv.config();
const request = require('supertest');
const host = process.env.HOST;
const port = process.env.PORT;


test('Отправка одного валидного сообщения', async () => {
    const myMessage = generateSomeMessages(1)
    const response = await sendMessage(myMessage, "queue")

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body).toBeFalsy();

})

test('Отправка нескольких валидных сообщений', async () => {
    const myMessages = generateSomeMessages(5)
    const results = [];
    await asyncLib.timesSeries(myMessages.length, async (i) => {
        results.push(await sendMessage(myMessages[i], "queue"));
    });

    results.forEach((element) => {
        expect(element.status).toBe(200);
        expect(element.body).toBeDefined();
        expect(element.body).toBeFalsy();
    });
})

test('Переполнение очереди', async () => { // в связке с гетом
    const myMessage = generateSomeMessages(1)
    const messageCount = 101;

    const responses = await Promise.all(
        Array.from({ length: messageCount }, () => sendMessage(myMessage, "queue"))
    );

    responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toBeFalsy();
    });

    const getResponses = await Promise.all(
        Array.from({ length: messageCount }, () => getMessage("queue"))
    );

    getResponses.forEach((response) => {
        expect(response.body).toEqual(myMessage);
    });
})

test('Переполнение очередей', async () => { // в связке с гетом
    const myMessage = generateSomeMessages(1)
    const queueCount = 101;
    
    const responses = await Promise.all(
        Array.from({ length: queueCount }, (_, i) => sendMessage(myMessage, "queue" + i))
    );

    responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toBeFalsy();
    });

    const getResponses = await Promise.all(
        Array.from({ length: queueCount }, (_, i) => getMessage("queue" + i))
    );

    getResponses.forEach((response) => {
        expect(response.body).toEqual(myMessage);
    });
})

test('Некорректный формат тела', async () => {
    const myMessage = {
        "notMessage": "sent from Jest"
    }
    const response = await request(`${host}:${port}/queue`)
        .put(`/queue`)
        .set('Accept', 'application/json')
        .send(myMessage)

    expect(response.status).toBe(400);
})

test('Сообщение без тела', async () => {
    const response = await request(`${host}:${port}/queue`)
        .put(`/queue`)

    expect(response.status).toBe(400);
})


function generateSomeMessages(count) {
    let messages = [];
    for (let i = 0; i < count; i++) {
        const currentDate = new Date()
        setTimeout(() => {}, 1);
        const myMessage = {
            "message": "sent from Jest " + currentDate.getTime()
        }
        messages.push(myMessage)
    }
    if (messages.length == 1) {
        return messages[0];
    }
    return messages;
}

async function sendMessage(message, queueName) {
    return await request(`${host}:${port}/queue`)
        .put(`/${queueName}`)
        .set('Accept', 'application/json')
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