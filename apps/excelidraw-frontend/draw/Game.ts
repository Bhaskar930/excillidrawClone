import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape =
  | { type: "rect"; x: number; y: number; width: number; height: number }
  | { type: "circle"; centerX: number; centerY: number; radius: number }
  | { type: "diamond"; x: number; y: number; width: number; height: number }
  | { type: "line"; startX: number; startY: number; endX: number; endY: number }
  | { type: "arrow"; startX: number; startY: number; endX: number; endY: number }
  | { type: "pencil"; points: { x: number; y: number }[] };

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[] = [];
  private history: Shape[][] = [];
  private historyIndex: number = -1;

  private roomId: string;
  private clicked: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private selectedTool: Tool | "eraser" = "circle";

  socket: WebSocket;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.roomId = roomId;
    this.socket = socket;

    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }

  destroy = () => {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
  };

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.clearCanvas();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "chat") {
        const parsedShape = JSON.parse(message.message);
        this.existingShapes.push(parsedShape.shape);
        this.clearCanvas();
      }
    };
  }

  setTool(tool: Tool | "eraser") {
    this.selectedTool = tool;
  }

  pushToHistory() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(this.existingShapes)));
    this.historyIndex++;
  }

  undo() {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this.existingShapes = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    this.clearCanvas();
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    this.existingShapes = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    this.clearCanvas();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(0,0,0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.existingShapes.forEach((shape) => {
      this.ctx.strokeStyle = "white";
      switch (shape.type) {
        case "rect":
          this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
          break;
        case "circle":
          this.ctx.beginPath();
          this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.closePath();
          break;
        case "diamond":
          const cx = shape.x + shape.width / 2;
          const cy = shape.y + shape.height / 2;
          this.ctx.beginPath();
          this.ctx.moveTo(cx, shape.y);
          this.ctx.lineTo(shape.x + shape.width, cy);
          this.ctx.lineTo(cx, shape.y + shape.height);
          this.ctx.lineTo(shape.x, cy);
          this.ctx.closePath();
          this.ctx.stroke();
          break;
        case "line":
          this.ctx.beginPath();
          this.ctx.moveTo(shape.startX, shape.startY);
          this.ctx.lineTo(shape.endX, shape.endY);
          this.ctx.stroke();
          break;
        case "arrow":
          this.ctx.beginPath();
          this.ctx.moveTo(shape.startX, shape.startY);
          this.ctx.lineTo(shape.endX, shape.endY);
          this.ctx.stroke();
          const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
          const headLen = 10;
          this.ctx.beginPath();
          this.ctx.moveTo(shape.endX, shape.endY);
          this.ctx.lineTo(shape.endX - headLen * Math.cos(angle - Math.PI / 6), shape.endY - headLen * Math.sin(angle - Math.PI / 6));
          this.ctx.lineTo(shape.endX - headLen * Math.cos(angle + Math.PI / 6), shape.endY - headLen * Math.sin(angle + Math.PI / 6));
          this.ctx.lineTo(shape.endX, shape.endY);
          this.ctx.stroke();
          this.ctx.closePath();
          break;
        case "pencil":
          this.ctx.beginPath();
          this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          this.ctx.stroke();
          this.ctx.closePath();
          break;
      }
    });
  }

  mouseDownHandler = (e: MouseEvent) => {
    this.clicked = true;
    this.startX = e.clientX;
    this.startY = e.clientY;

    if (this.selectedTool === "pencil") {
      const newShape: Shape = { type: "pencil", points: [{ x: this.startX, y: this.startY }] };
      this.existingShapes.push(newShape);
    } else if (this.selectedTool === "eraser") {
      this.eraseAtPoint(e.clientX, e.clientY);
      this.pushToHistory();
    }
  };

  mouseUpHandler = (e: MouseEvent) => {
    if (this.selectedTool === "eraser") {
      this.clearCanvas();
      return;
    }

    this.clicked = false;
    const width = e.clientX - this.startX;
    const height = e.clientY - this.startY;

    let shape: Shape | null = null;
    switch (this.selectedTool) {
      case "rect":
        shape = { type: "rect", x: this.startX, y: this.startY, width, height };
        break;
      case "circle":
        const radius = Math.max(width, height) / 2;
        shape = { type: "circle", centerX: this.startX + radius, centerY: this.startY + radius, radius };
        break;
      case "diamond":
        shape = { type: "diamond", x: this.startX, y: this.startY, width, height };
        break;
      case "line":
        shape = { type: "line", startX: this.startX, startY: this.startY, endX: e.clientX, endY: e.clientY };
        break;
      case "arrow":
        shape = { type: "arrow", startX: this.startX, startY: this.startY, endX: e.clientX, endY: e.clientY };
        break;
      case "pencil":
        shape = this.existingShapes[this.existingShapes.length - 1];
        break;
    }

    if (!shape) return;

    this.pushToHistory();
    this.clearCanvas();

    this.socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId: this.roomId,
      })
    );
  };

  mouseMoveHandler = (e: MouseEvent) => {
    if (!this.clicked) return;
    const width = e.clientX - this.startX;
    const height = e.clientY - this.startY;

    if (this.selectedTool === "pencil") {
      const pencilShape = this.existingShapes[this.existingShapes.length - 1];
      if (pencilShape.type === "pencil") {
        pencilShape.points.push({ x: e.clientX, y: e.clientY });
        this.clearCanvas();
      }
    } else if (this.selectedTool === "eraser") {
      this.eraseAtPoint(e.clientX, e.clientY);
      this.clearCanvas();
    } else {
      this.clearCanvas();
      this.ctx.strokeStyle = "white";
      switch (this.selectedTool) {
        case "rect":
          this.ctx.strokeRect(this.startX, this.startY, width, height);
          break;
        case "circle":
          const radius = Math.max(width, height) / 2;
          const centerX = this.startX + radius;
          const centerY = this.startY + radius;
          this.ctx.beginPath();
          this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.closePath();
          break;
        case "diamond":
          const cx = this.startX + width / 2;
          const cy = this.startY + height / 2;
          this.ctx.beginPath();
          this.ctx.moveTo(cx, this.startY);
          this.ctx.lineTo(this.startX + width, cy);
          this.ctx.lineTo(cx, this.startY + height);
          this.ctx.lineTo(this.startX, cy);
          this.ctx.closePath();
          this.ctx.stroke();
          break;
        case "line":
          this.ctx.beginPath();
          this.ctx.moveTo(this.startX, this.startY);
          this.ctx.lineTo(e.clientX, e.clientY);
          this.ctx.stroke();
          break;
        case "arrow":
          this.ctx.beginPath();
          this.ctx.moveTo(this.startX, this.startY);
          this.ctx.lineTo(e.clientX, e.clientY);
          this.ctx.stroke();
          const angle = Math.atan2(e.clientY - this.startY, e.clientX - this.startX);
          const headLen = 10;
          this.ctx.beginPath();
          this.ctx.moveTo(e.clientX, e.clientY);
          this.ctx.lineTo(
            e.clientX - headLen * Math.cos(angle - Math.PI / 6),
            e.clientY - headLen * Math.sin(angle - Math.PI / 6)
          );
          this.ctx.lineTo(
            e.clientX - headLen * Math.cos(angle + Math.PI / 6),
            e.clientY - headLen * Math.sin(angle + Math.PI / 6)
          );
          this.ctx.lineTo(e.clientX, e.clientY);
          this.ctx.stroke();
          this.ctx.closePath();
          break;
      }
    }
  };

  private eraseAtPoint(x: number, y: number) {
    // Remove shapes where the mouse is inside bounding box
    this.existingShapes = this.existingShapes.filter((shape) => {
      switch (shape.type) {
        case "rect":
        case "diamond":
          return !(x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height);
        case "circle":
          return Math.hypot(x - shape.centerX, y - shape.centerY) > shape.radius;
        case "line":
        case "arrow":
          // simple line distance check
          const dx = shape.endX - shape.startX;
          const dy = shape.endY - shape.startY;
          const length = Math.hypot(dx, dy);
          const dot = ((x - shape.startX) * dx + (y - shape.startY) * dy) / (length * length);
          const closestX = shape.startX + dot * dx;
          const closestY = shape.startY + dot * dy;
          const dist = Math.hypot(x - closestX, y - closestY);
          return dist > 5; // 5 px tolerance
        case "pencil":
          return !shape.points.some(p => Math.hypot(p.x - x, p.y - y) < 5);
      }
    });
  }

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }
}
