"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SessionStore {
    constructor() {
        this.sessions = new Map();
    }
    saveSession(sessionID, session) {
        this.sessions.set(sessionID, session);
    }
    findSession(sessionID) {
        return this.sessions.get(sessionID);
    }
    findAllSessions() {
        return [...this.sessions.values()];
    }
}
exports.default = SessionStore;
//# sourceMappingURL=sessionStore.js.map