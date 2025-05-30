/**
 * Azure Functions Entry Point
 * This file serves as the entry point for Azure Static Web Apps API integration
 */
const app = require('../app');

// Export handler for Azure Functions integration
module.exports = async function (context, req) {
  // Create a mock Express response object
  const res = {
    headers: {},
    body: null,
    statusCode: 200,
    setHeader: function(key, value) {
      this.headers[key] = value;
      return this;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    send: function(body) {
      this.body = body;
      return this;
    },
    json: function(body) {
      this.body = body;
      this.headers['Content-Type'] = 'application/json';
      return this;
    }
  };

  // Create a promise to handle the Express app processing
  await new Promise((resolve) => {
    // Add resolver to response object
    res.end = resolve;

    // Process the request with Express
    app(req, res, () => {
      // Handle case where no route matched (404)
      if (!res.body) {
        res.status(404).json({ error: 'Not Found' });
      }
      resolve();
    });
  });

  // Set Azure Functions response
  context.res = {
    status: res.statusCode,
    headers: res.headers,
    body: res.body
  };
};

