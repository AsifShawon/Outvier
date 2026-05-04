'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Bot, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AiProvidersPage() {
  const [provider, setProvider] = useState('groq');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('llama3-70b-8192');

  useEffect(() => {
    // Load from localStorage for MVP
    const saved = localStorage.getItem('outvier_ai_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.provider) setProvider(parsed.provider);
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.model) setModel(parsed.model);
      } catch (e) {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('outvier_ai_settings', JSON.stringify({ provider, apiKey, model }));
    toast.success('AI Provider settings saved successfully.');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-display">AI Copilot Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the AI provider and model used for the Outvier Copilot chat.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-card border border-border/50 rounded-xl p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              AI Provider
            </label>
            <Select value={provider} onValueChange={(v) => v && setProvider(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groq">Groq (Fastest)</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              API Key
            </label>
            <Input 
              type="password" 
              placeholder="Enter your API key..." 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Stored securely in your local environment for MVP.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Model Selection
            </label>
            <Input 
              type="text" 
              placeholder="e.g. llama3-70b-8192" 
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
