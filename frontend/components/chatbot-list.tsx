"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Trash2, Edit, BarChart3 } from "lucide-react"
import type { Chatbot } from "@/lib/types"

interface ChatbotListProps {
  chatbots: Chatbot[]
  onDelete?: (id: number) => void
  onEdit?: (chatbot: Chatbot) => void
  onViewAnalytics?: (id: number) => void
}

export function ChatbotList({ chatbots, onDelete, onEdit, onViewAnalytics }: ChatbotListProps) {
  if (chatbots.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No chatbots yet</h3>
          <p className="text-sm text-muted-foreground">Create your first chatbot to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {chatbots.map((chatbot) => (
        <Card key={chatbot.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{chatbot.name}</CardTitle>
                <CardDescription className="mt-1">{chatbot.description || "No description"}</CardDescription>
              </div>
              <div
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  chatbot.status === "active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                }`}
              >
                {chatbot.status}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {chatbot.llm_id && (
                <div className="flex items-center justify-between">
                  <span>LLM ID:</span>
                  <span className="font-mono">{chatbot.llm_id}</span>
                </div>
              )}
              {chatbot.embedding_id && (
                <div className="flex items-center justify-between">
                  <span>Embedding ID:</span>
                  <span className="font-mono">{chatbot.embedding_id}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button size="sm" variant="outline" onClick={() => onEdit(chatbot)} className="flex-1">
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
              )}
              {onViewAnalytics && (
                <Button size="sm" variant="outline" onClick={() => onViewAnalytics(chatbot.id)} className="flex-1">
                  <BarChart3 className="mr-1 h-3 w-3" />
                  Stats
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="outline" onClick={() => onDelete(chatbot.id)} className="text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
