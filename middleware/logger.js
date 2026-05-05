const axios = require("axios");

const loggingMiddleware = async (req, res, next) => {
  try {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    const authToken = process.env.AUTH_TOKEN || "default-token";

    axios
      .post("http://20.207.122.201/logging-service", logData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      })
      .catch((error) => {
        if (error.response) {
        } else if (error.request) {
        }
      });

    next();
  } catch (error) {
    console.error("Logger middleware error:", error.message);
    next();
  }
};

module.exports = loggingMiddleware;
