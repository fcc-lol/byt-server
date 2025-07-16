import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

// Initialize environment variables
dotenv.config();

const app = express();
const port = 3102;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, replace with specific origins
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000, // Increase ping timeout to handle slower connections
  transports: ["websocket", "polling"] // Enable both WebSocket and polling
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Send welcome message
  socket.emit("connection_status", {
    status: "connected",
    message: "Connected to notification server",
    socketId: socket.id
  });

  // Handle incoming messages
  socket.on("message", (data) => {
    try {
      console.log("Received:", data);
      // Broadcast message to all connected clients
      io.emit("message", data);
    } catch (error) {
      console.error("Error processing message:", error);
      socket.emit("error", {
        message: "Error processing message",
        error: error.message
      });
    }
  });

  // Handle client disconnection
  socket.on("disconnect", (reason) => {
    console.log(`Client ${socket.id} disconnected:`, reason);
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// REST API endpoints
app.post("/notify", (req, res) => {
  const notification = req.body;

  try {
    // Broadcast notification to all connected clients
    io.emit("notification", notification);

    res.status(200).json({
      message: "Notification sent successfully",
      recipients: io.engine.clientsCount
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      error: "Failed to send notification",
      message: error.message
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    connections: io.engine.clientsCount,
    uptime: process.uptime()
  });
});

// Middleware to check for valid API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.query.fccApiKey;

  if (!apiKey || apiKey !== process.env.FCC_API_KEY) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing FCC API key"
    });
  }

  next();
};

app.get("/api/flights/:type", validateApiKey, async (req, res) => {
  const airport = "KJFK";

  try {
    const response = await fetch(
      `https://aeroapi.flightaware.com/aeroapi/airports/${airport}/flights/${req.params.type}`,
      {
        headers: {
          "x-apikey": process.env.FLIGHTAWARE_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `FlightAware API responded with status: ${response.status}`
      );
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching flight data:", error);
    res.status(500).json({
      error: "Failed to fetch flight data",
      message: error.message
    });
  }
});

app.get("/api/birthdays", validateApiKey, async (req, res) => {
  const response = await fetch(
    `https://birthday-calendar-server.fcc.lol/?fccApiKey=${process.env.BIRTHDAY_CALENDAR_SERVER_API_KEY}`
  );
  const data = await response.json();
  res.json(data);
});

app.get("/api/rebrickable/minifigs/:id", validateApiKey, async (req, res) => {
  const response = await fetch(
    `https://rebrickable.com/api/v3/lego/minifigs/${req.params.id}/`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `key ${process.env.REBRICKABLE_API_KEY}`
      }
    }
  );
  const data = await response.json();
  res.json(data);
});

app.get("/api/this-or-that/random-pair", validateApiKey, async (req, res) => {
  try {
    const response = await fetch(
      `https://this-or-that-machine-server.noshado.ws/votes/get-random-pair-votes?key=${process.env.THIS_OR_THAT_MACHINE_SERVER_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(
        `This or That API responded with status: ${response.status}`
      );
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching This or That data:", error);
    res.status(500).json({
      error: "Failed to fetch This or That data",
      message: error.message
    });
  }
});

// Start the server
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
