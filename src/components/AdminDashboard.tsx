"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Plus, CheckCircle2, Circle, Trash2, LogOut, MessageSquare, Clock, Eye } from "lucide-react";

export function AdminDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [interns, setInterns] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newInternName, setNewInternName] = useState("");
  const [newTask, setNewTask] = useState({ title: "", internId: "" });
  const [newNote, setNewNote] = useState({ content: "", internId: "all" });
  const [sendingNote, setSendingNote] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: internsData } = await supabase.from("interns").select("*");
    const { data: tasksData } = await supabase.from("tasks").select("*, interns(name)");
    
    // Fetch notes sent to admin OR sent by admin
    const { data: notesData } = await supabase
      .from("notes")
      .select("*, sender:sender_id, receiver:receiver_id")
      .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    // Enriched notes with names
    const enrichedNotes = (notesData || []).map(note => {
      if (note.sender_role === 'intern') {
        const intern = internsData?.find(i => i.id === note.sender_id);
        return { ...note, sender_name: intern?.name || 'Unknown Intern' };
      } else {
        return { ...note, sender_name: 'You (Founder)' };
      }
    });

    setInterns(internsData || []);
    setTasks(tasksData || []);
    setNotes(enrichedNotes);
    setLoading(false);
  };

  const sendNote = async () => {
    if (!newNote.content.trim()) return;
    setSendingNote(true);
    
    const isGroup = newNote.internId === "all";
    const noteData = {
      sender_id: user.id,
      sender_role: 'admin',
      content: newNote.content.trim(),
      receiver_id: isGroup ? null : newNote.internId,
      is_group: isGroup
    };

    const { error } = await supabase.from("notes").insert([noteData]);

    if (error) {
      toast.error("Error sending note: " + error.message);
    } else {
      toast.success(isGroup ? "Group message sent!" : "Note sent!");
      setNewNote({ content: "", internId: "all" });
      fetchData();
    }
    setSendingNote(false);
  };

  const markAsRead = async (noteId: string) => {
    const { error } = await supabase
      .from("notes")
      .update({ is_read: true })
      .eq("id", noteId);
    
    if (error) {
      toast.error("Error updating note");
    } else {
      fetchData();
    }
  };

  const addIntern = async () => {
    if (!newInternName.trim()) return;
    const { error } = await supabase.from("interns").insert([{ name: newInternName.trim() }]);
    if (error) {
      toast.error("Error adding intern: " + error.message);
    } else {
      toast.success("Intern added successfully!");
      setNewInternName("");
      fetchData();
    }
  };

  const removeIntern = async (id: string) => {
    const { error } = await supabase.from("interns").delete().eq("id", id);
    if (error) {
      toast.error("Error removing intern");
    } else {
      toast.success("Intern removed");
      fetchData();
    }
  };

  const assignTask = async () => {
    if (!newTask.title.trim() || !newTask.internId) return;
    const { error } = await supabase.from("tasks").insert([
      { title: newTask.title.trim(), intern_id: newTask.internId, status: "pending" }
    ]);
    if (error) {
      toast.error("Error assigning task");
    } else {
      toast.success("Task assigned!");
      setNewTask({ title: "", internId: "" });
      fetchData();
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Founder Dashboard</h1>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">Welcome, {user.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </header>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
          {/* Add Intern */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" /> Add New Intern
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 p-4 sm:p-6 pt-0 sm:pt-0">
              <Input
                placeholder="Intern Name"
                value={newInternName}
                onChange={(e) => setNewInternName(e.target.value)}
                className="h-9 sm:h-10"
              />
              <Button onClick={addIntern} size="sm" className="h-9 sm:h-10 px-3">
                <Plus className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Assign Task */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Plus className="h-5 w-5" /> Assign Task
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0 sm:pt-0">
              <Input
                placeholder="Task Title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="h-9 sm:h-10"
              />
              <div className="flex gap-2">
                <Select
                  value={newTask.internId}
                  onValueChange={(val) => setNewTask({ ...newTask, internId: val })}
                >
                  <SelectTrigger className="w-full h-9 sm:h-10">
                    <SelectValue placeholder="Select Intern" />
                  </SelectTrigger>
                  <SelectContent>
                    {interns.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={assignTask} size="sm" className="h-9 sm:h-10 px-4">Assign</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Intern Progress & Tasks</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 pt-0 sm:pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 py-3">Intern</TableHead>
                      <TableHead className="px-4 py-3">Task</TableHead>
                      <TableHead className="px-4 py-3 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-zinc-500 py-8">
                          No tasks assigned yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium px-4 py-3 text-sm">{task.interns?.name}</TableCell>
                          <TableCell className="px-4 py-3 text-sm">{task.title}</TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            {task.status === "completed" ? (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-[10px] px-1.5 h-5">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Done
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                                <Circle className="mr-1 h-3 w-3" /> Wait
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Messaging Section */}
          <Card className="shadow-sm border-indigo-100 dark:border-indigo-900/30">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MessageSquare className="h-5 w-5 text-indigo-500" /> Communications
              </CardTitle>
              <CardDescription className="text-xs">Chat with interns or send group alerts.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              {/* Send Message Form */}
              <div className="space-y-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <Select
                  value={newNote.internId}
                  onValueChange={(val) => setNewNote({ ...newNote, internId: val })}
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-zinc-50 dark:bg-zinc-900">
                    <SelectValue placeholder="Select Recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Interns (Group)</SelectItem>
                    {interns.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Input
                    placeholder="Type a message..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    className="h-9 pr-10 text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && sendNote()}
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-0 top-0 h-9 w-9 text-indigo-500 hover:text-indigo-600"
                    onClick={sendNote}
                    disabled={sendingNote || !newNote.content.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Message List */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-200">
                {notes.length === 0 ? (
                  <p className="text-center text-zinc-500 py-8 text-xs italic">No messages yet.</p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 border rounded-xl space-y-1.5 transition-all ${
                        note.sender_role === 'admin' 
                          ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-50 dark:border-indigo-900/20 ml-4' 
                          : note.is_read ? 'bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100' : 'bg-white dark:bg-zinc-900 border-indigo-100 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${note.sender_role === 'admin' ? 'text-indigo-600' : 'text-zinc-500'}`}>
                            {note.sender_name}
                          </span>
                          {note.is_group && (
                            <Badge variant="outline" className="text-[8px] h-3 px-1 py-0 border-indigo-200 text-indigo-500 font-normal">
                              GROUP
                            </Badge>
                          )}
                        </div>
                        <span className="text-[9px] text-zinc-400">
                          {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {note.content}
                      </p>
                      {note.sender_role === 'intern' && !note.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(note.id)}
                          className="h-5 text-[9px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 w-full mt-1 p-0"
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interns List */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Manage Interns</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {interns.map((i) => (
                <div key={i.id} className="flex items-center justify-between p-2.5 border rounded-lg bg-white dark:bg-zinc-900 group">
                  <span className="font-medium truncate text-sm">{i.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeIntern(i.id)} 
                    className="h-7 w-7 text-zinc-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
