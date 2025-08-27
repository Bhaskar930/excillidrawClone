import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import {
  Circle,
  Pencil,
  RectangleHorizontalIcon,
  Slash,
  GitPullRequest,
  Trash2,
  RotateCcw,
  RotateCw,
} from "lucide-react"; // Trash2 for eraser, RotateCcw = undo, RotateCw = redo
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "pencil" | "diamond" | "line" | "arrow" | "eraser";

export function Canvas({ roomId, socket }: { socket: WebSocket; roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("circle");

  // Update selected tool in Game whenever it changes
  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  // Initialize Game instance
  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, roomId, socket);
      setGame(g);

      return () => g.destroy();
    }
  }, [canvasRef, roomId, socket]);

  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight}></canvas>
      <Topbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        game={game}
      />
    </div>
  );
}

// Topbar component
function Topbar({
  selectedTool,
  setSelectedTool,
  game,
}: {
  selectedTool: Tool;
  setSelectedTool: (t: Tool) => void;
  game?: Game;
}) {
  const tools: { type: Tool; icon: JSX.Element }[] = [
    { type: "pencil", icon: <Pencil /> },
    { type: "rect", icon: <RectangleHorizontalIcon /> },
    { type: "circle", icon: <Circle /> },
    { type: "diamond", icon: <Slash /> }, // Replace with actual diamond icon if available
    { type: "line", icon: <Slash /> },    // Replace with line icon
    { type: "arrow", icon: <GitPullRequest /> },
    { type: "eraser", icon: <Trash2 /> },
  ];

  return (
    <div style={{ position: "fixed", top: 10, left: 10 }}>
      <div className="flex gap-2">
        {tools.map((tool) => (
          <IconButton
            key={tool.type}
            onClick={() => setSelectedTool(tool.type)}
            activated={selectedTool === tool.type}
            icon={tool.icon}
          />
        ))}

        {/* Undo Button */}
        <IconButton
          onClick={() => game?.undo()}
          activated={false}
          icon={<RotateCcw />}
        />
        {/* Redo Button */}
        <IconButton
          onClick={() => game?.redo()}
          activated={false}
          icon={<RotateCw />}
        />
      </div>
    </div>
  );
}
