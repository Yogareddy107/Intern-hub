"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, Circle, LogOut, ClipboardList, MessageSquare, Send } from "lucide-react";

export function InternDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch tasks
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .eq("intern_id", user.id)
      .order("created_at", { ascending: false });
    
    // Fetch notes sent TO this intern OR Group messages OR sent BY this intern
    const { data: notesData } = await supabase
      .from("notes")
      .select("*")
      .or(`receiver_id.eq.${user.id},is_group.eq.true,sender_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    setTasks(tasksData || []);
    setNotes(notesData || []);
    setLoading(false);
  };

  const completeTask = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: "completed" })
      .eq("id", taskId);

    if (error) {
      toast.error("Error updating task");
    } else {
      toast.success("Task completed!");
      fetchData();
    }
  };

  const sendNote = async () => {
    if (!note.trim()) return;
    setSendingNote(true);
    const { error } = await supabase
      .from("notes")
      .insert({
        sender_id: user.id,
        sender_role: 'intern',
        content: note.trim(),
        is_group: false
      });

    if (error) {
      toast.error("Failed to send note");
    } else {
      toast.success("Note sent to founder");
      setNote("");
      fetchData();
    }
    setSendingNote(false);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Intern Portal</h1>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">Welcome, {user.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </header>

        <div className="grid gap-4 sm:gap-6">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <ClipboardList className="h-5 w-5 text-indigo-500" /> Your Assigned Tasks
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Mark tasks as completed once you finish them.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-zinc-300 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">No tasks assigned yet. Enjoy your day!</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-xl bg-white dark:bg-zinc-900 transition-all hover:shadow-md gap-3 sm:gap-4"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-sm sm:text-lg font-semibold ${task.status === 'completed' ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {task.title}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {task.status === 'completed' ? (
                            <Badge variant="default" className="bg-green-500 text-[10px] px-1.5 h-5">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Done
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                              <Circle className="mr-1 h-3 w-3" /> Pending
                            </Badge>
                          )}
                          <span className="text-[10px] text-zinc-400">
                            {new Date(task.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {task.status === "pending" && (
                        <Button
                          onClick={() => completeTask(task.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto h-8 sm:h-9"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-lg">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MessageSquare className="h-5 w-5 text-indigo-500" /> Communications
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Chat with Founder and see group updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-6">
              {/* Message List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-200 bg-zinc-50/30 dark:bg-zinc-900/10 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                {notes.length === 0 ? (
                  <p className="text-center text-zinc-500 py-8 text-xs italic">No messages yet.</p>
                ) : (
                  notes.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border rounded-xl space-y-1.5 transition-all ${
                        n.sender_role === 'admin' 
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 mr-8' 
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ml-8'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${n.sender_role === 'admin' ? 'text-indigo-600' : 'text-zinc-500'}`}>
                            {n.sender_role === 'admin' ? 'Founder' : 'You'}
                          </span>
                          {n.is_group && (
                            <Badge variant="outline" className="text-[8px] h-3 px-1 py-0 border-indigo-200 text-indigo-500 font-normal">
                              GROUP MESSAGE
                            </Badge>
                          )}
                        </div>
                        <span className="text-[9px] text-zinc-400">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {n.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Send Note Form */}
              <div className="space-y-3 pt-2">
                <Textarea
                  placeholder="Type a note to the Founder..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[80px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 text-xs rounded-xl shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendNote();
                    }
                  }}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={sendNote}
                    disabled={!note.trim() || sendingNote}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 rounded-lg px-6 shadow-md transition-all active:scale-95"
                  >
                    {sendingNote ? (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <>
                        <Send className="mr-2 h-3.5 w-3.5" /> Send Note
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    );
  }

