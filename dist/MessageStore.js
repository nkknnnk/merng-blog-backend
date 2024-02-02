"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MessageStore {
    constructor() {
        this.messages = [];
    }
    saveMessage(message) {
        this.messages.push(message);
    }
    findMessagesForUser(userID) {
        return this.messages.filter((message) => (message.to === userID || message.from === userID));
    }
}
exports.default = MessageStore;
//# sourceMappingURL=MessageStore.js.map