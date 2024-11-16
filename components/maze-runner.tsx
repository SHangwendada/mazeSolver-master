"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react'

type Cell = {
  x: number
  y: number
  type: 'wall' | 'path' | 'start' | 'end'
}

type Direction = 'up' | 'down' | 'left' | 'right'

export function MazeRunnerComponent() {
  const [maze, setMaze] = useState<string[]>([])
  const [mazeGrid, setMazeGrid] = useState<Cell[][]>([])
  const [start, setStart] = useState<Cell | null>(null)
  const [end, setEnd] = useState<Cell | null>(null)
  const [currentPos, setCurrentPos] = useState<Cell | null>(null)
  const [wallSymbol, setWallSymbol] = useState('#')
  const [pathSymbol, setPathSymbol] = useState('.')
  const [startSymbol, setStartSymbol] = useState('P')
  const [endSymbol, setEndSymbol] = useState('E')
  const [moveKeys, setMoveKeys] = useState({ up: 'w', down: 's', left: 'a', right: 'd' })
  const [isAnimating, setIsAnimating] = useState(false)
  const [cellSize, setCellSize] = useState(30)
  const [solutionMoves, setSolutionMoves] = useState<string>('')
  const [isMazeGenerated, setIsMazeGenerated] = useState(false)
  const mazeInputRef = useRef<HTMLTextAreaElement>(null)
  const mazeContainerRef = useRef<HTMLDivElement>(null)

  const adjustCellSize = useCallback(() => {
    if (mazeContainerRef.current && maze.length > 0) {
      const containerWidth = mazeContainerRef.current.clientWidth
      const containerHeight = mazeContainerRef.current.clientHeight
      const mazeWidth = maze[0].length
      const mazeHeight = maze.length
      const cellWidth = Math.floor(containerWidth / mazeWidth)
      const cellHeight = Math.floor(containerHeight / mazeHeight)
      setCellSize(Math.max(Math.min(cellWidth, cellHeight), 10)) // Ensure minimum cell size of 10px
    }
  }, [maze])

  const getNextCell = useCallback((cell: Cell, direction: Direction): Cell | null => {
    const { x, y } = cell
    switch (direction) {
      case 'up':
        return y > 0 ? mazeGrid[y - 1][x] : null
      case 'down':
        return y < mazeGrid.length - 1 ? mazeGrid[y + 1][x] : null
      case 'left':
        return x > 0 ? mazeGrid[y][x - 1] : null
      case 'right':
        return x < mazeGrid[0].length - 1 ? mazeGrid[y][x + 1] : null
    }
  }, [mazeGrid])

  const getKeyForDirection = useCallback((direction: Direction): string => {
    switch (direction) {
      case 'up': return moveKeys.up
      case 'down': return moveKeys.down
      case 'left': return moveKeys.left
      case 'right': return moveKeys.right
    }
  }, [moveKeys])

  const animatePath = useCallback(async (path: Cell[]) => {
    setIsAnimating(true)
    for (const cell of path) {
      setCurrentPos(cell)
      await new Promise(resolve => setTimeout(resolve, 50)) // Faster animation
    }
    setIsAnimating(false)
  }, [])

  const solveMaze = useCallback(() => {
    if (!start || !end) return

    const visited: boolean[][] = maze.map(row => row.split('').map(() => false))
    const queue: { cell: Cell; path: Cell[]; moves: string[] }[] = [{ cell: start, path: [start], moves: [] }]

    while (queue.length > 0) {
      const { cell, path, moves } = queue.shift()!

      if (cell.x === end.x && cell.y === end.y) {
        animatePath(path)
        setSolutionMoves(moves.join(''))
        return
      }

      const directions: Direction[] = ['up', 'down', 'left', 'right']
      for (const direction of directions) {
        const newCell = getNextCell(cell, direction)
        if (newCell && !visited[newCell.y][newCell.x] && newCell.type !== 'wall') {
          visited[newCell.y][newCell.x] = true
          queue.push({ 
            cell: newCell, 
            path: [...path, newCell], 
            moves: [...moves, getKeyForDirection(direction)]
          })
        }
      }
    }

    alert('No path found!')
  }, [start, end, maze, getNextCell, getKeyForDirection, animatePath])

  useEffect(() => {
    if (maze.length > 0) {
        const grid = maze.map((row, y) =>
          row.split('').map((cell, x) => ({
            x,
            y,
            type: cell === wallSymbol ? 'wall' : cell === startSymbol ? 'start' : cell === endSymbol ? 'end' : 'path'
          } as Cell))
        )
      setMazeGrid(grid)
      setStart(grid.flat().find(cell => cell.type === 'start') || null)
      setEnd(grid.flat().find(cell => cell.type === 'end') || null)
      setIsMazeGenerated(true)
      adjustCellSize()
    } else {
      setIsMazeGenerated(false)
    }
  }, [maze, wallSymbol, startSymbol, endSymbol, adjustCellSize])

  useEffect(() => {
    window.addEventListener('resize', adjustCellSize)
    return () => window.removeEventListener('resize', adjustCellSize)
  }, [adjustCellSize])

  const handleMazeInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMaze(event.target.value.split('\n'))
  }

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (isAnimating) return

    const key = event.key.toLowerCase()
    let direction: Direction | null = null

    if (key === moveKeys.up) direction = 'up'
    else if (key === moveKeys.down) direction = 'down'
    else if (key === moveKeys.left) direction = 'left'
    else if (key === moveKeys.right) direction = 'right'

    if (direction && currentPos) {
      const nextCell = getNextCell(currentPos, direction)
      if (nextCell && nextCell.type !== 'wall') {
        setCurrentPos(nextCell)
      }
    }
  }, [isAnimating, moveKeys, currentPos, getNextCell])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-4 sm:p-8">
      <div className="bg-white rounded-lg shadow-2xl p-4 sm:p-8 w-full max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-gray-800">迷宫解决器</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Label htmlFor="mazeInput" className="block text-sm font-medium text-gray-700 mb-2">
              输入迷宫
            </Label>
            <Textarea
              id="mazeInput"
              ref={mazeInputRef}
              className="w-full h-48 sm:h-64 font-mono text-sm"
              placeholder="输入迷宫，每行一个..."
              onChange={handleMazeInput}
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="wallSymbol" className="block text-sm font-medium text-gray-700 mb-2">
                  墙壁符号
                </Label>
                <Input
                  id="wallSymbol"
                  type="text"
                  maxLength={1}
                  value={wallSymbol}
                  onChange={(e) => setWallSymbol(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pathSymbol" className="block text-sm font-medium text-gray-700 mb-2">
                  路径符号
                </Label>
                <Input
                  id="pathSymbol"
                  type="text"
                  maxLength={1}
                  value={pathSymbol}
                  onChange={(e) => setPathSymbol(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="startSymbol" className="block text-sm font-medium text-gray-700 mb-2">
                  起点符号
                </Label>
                <Input
                  id="startSymbol"
                  type="text"
                  maxLength={1}
                  value={startSymbol}
                  onChange={(e) => setStartSymbol(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endSymbol" className="block text-sm font-medium text-gray-700 mb-2">
                  终点符号
                </Label>
                <Input
                  id="endSymbol"
                  type="text"
                  maxLength={1}
                  value={endSymbol}
                  onChange={(e) => setEndSymbol(e.target.value)}
                />
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={solveMaze}>
              解决迷宫
            </Button>
          </div>
          <div
            ref={mazeContainerRef}
            className={`relative ${isMazeGenerated ? 'bg-gray-100 rounded-lg overflow-hidden' : ''} w-full h-[300px] sm:h-[400px]`}
            tabIndex={0}
            onKeyDown={handleKeyPress}
          >
            {isMazeGenerated && mazeGrid.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`absolute ${
                    cell.type === 'wall'
                      ? 'bg-gray-800'
                      : cell.type === 'start'
                      ? 'bg-green-500'
                      : cell.type === 'end'
                      ? 'bg-red-500'
                      : 'bg-white'
                  }`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    left: x * cellSize,
                    top: y * cellSize,
                  }}
                />
              ))
            )}
            <AnimatePresence>
              {currentPos && (
                <motion.div
                  key={`${currentPos.x}-${currentPos.y}`}
                  className="absolute bg-blue-500 rounded-full"
                  style={{
                    width: cellSize * 0.8,
                    height: cellSize * 0.8,
                  }}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{
                    x: currentPos.x * cellSize + cellSize * 0.1,
                    y: currentPos.y * cellSize + cellSize * 0.1,
                    scale: 1,
                    opacity: 1,
                  }}
                  exit={{ scale: 0.8, opacity: 0.5 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">移动键设置</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(moveKeys).map(([direction, key]) => (
              <div key={direction}>
                <Label htmlFor={`moveKey-${direction}`} className="block text-sm font-medium text-gray-700 mb-2">
                  {direction.charAt(0).toUpperCase() + direction.slice(1)}
                </Label>
                <Input
                  id={`moveKey-${direction}`}
                  type="text"
                  maxLength={1}
                  value={key}
                  onChange={(e) => setMoveKeys({ ...moveKeys, [direction]: e.target.value.toLowerCase() })}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => handleKeyPress({ key: moveKeys.left } as React.KeyboardEvent)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="grid grid-rows-2 gap-2">
              <Button variant="outline" onClick={() => handleKeyPress({ key: moveKeys.up } as React.KeyboardEvent)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => handleKeyPress({ key: moveKeys.down } as React.KeyboardEvent)}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => handleKeyPress({ key: moveKeys.right } as React.KeyboardEvent)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {solutionMoves && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">解决方案</h2>
            <p className="text-lg font-mono break-all">{solutionMoves}</p>
          </div>
        )}
      </div>
    </div>
  )
}