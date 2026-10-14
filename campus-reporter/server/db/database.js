const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

class JsonDatabase {
  constructor() {
    this.dataDir = config.DATA_DIR;
    this.cache = {};
    this.init();
  }

  init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  _getFilePath(collectionName) {
    return path.join(this.dataDir, `${collectionName}.json`);
  }

  _loadCollection(collectionName) {
    if (this.cache[collectionName]) {
      return this.cache[collectionName];
    }
    const filePath = this._getFilePath(collectionName);
    if (!fs.existsSync(filePath)) {
      this.cache[collectionName] = [];
      this._saveCollection(collectionName, []);
      return [];
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      this.cache[collectionName] = Array.isArray(data) ? data : [];
      return this.cache[collectionName];
    } catch (err) {
      console.error(`Error reading ${collectionName}.json, returning empty array:`, err);
      this.cache[collectionName] = [];
      return [];
    }
  }

  _saveCollection(collectionName, data) {
    this.cache[collectionName] = data;
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    const targetPath = this._getFilePath(collectionName);
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
  }

  find(collectionName, predicate = null, sortFn = null) {
    const list = this._loadCollection(collectionName);
    let results = predicate ? list.filter(predicate) : [...list];
    if (sortFn) {
      results.sort(sortFn);
    }
    return JSON.parse(JSON.stringify(results));
  }

  findOne(collectionName, predicate) {
    const list = this._loadCollection(collectionName);
    const item = list.find(predicate);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  findById(collectionName, id) {
    return this.findOne(collectionName, item => item.id === id);
  }

  create(collectionName, item) {
    const list = this._loadCollection(collectionName);
    const record = {
      id: item.id || crypto.randomUUID(),
      ...item,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    };
    list.push(record);
    this._saveCollection(collectionName, list);
    return JSON.parse(JSON.stringify(record));
  }

  update(collectionName, id, updates) {
    const list = this._loadCollection(collectionName);
    const index = list.findIndex(item => item.id === id);
    if (index === -1) {
      return null;
    }
    const current = list[index];
    const updated = {
      ...current,
      ...updates,
      id: current.id, // protect id
      createdAt: current.createdAt, // protect original creation
      updatedAt: new Date().toISOString()
    };
    list[index] = updated;
    this._saveCollection(collectionName, list);
    return JSON.parse(JSON.stringify(updated));
  }

  delete(collectionName, id) {
    const list = this._loadCollection(collectionName);
    const index = list.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }
    list.splice(index, 1);
    this._saveCollection(collectionName, list);
    return true;
  }

  count(collectionName, predicate = null) {
    const list = this._loadCollection(collectionName);
    if (!predicate) return list.length;
    return list.filter(predicate).length;
  }

  clear(collectionName) {
    this._saveCollection(collectionName, []);
  }
}

const db = new JsonDatabase();
module.exports = db;
