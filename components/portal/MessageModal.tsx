'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

interface MessageModalProps {
  open: boolean;
  onClose: () => void;
  recipientName: string;
  recipientId: string;
  onSend: (data: { toId: string; subject: string; message: string }) => Promise<void>;
}

export default function MessageModal({ open, onClose, recipientName, recipientId, onSend }: MessageModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      await onSend({ toId: recipientId, subject: subject.trim(), message: message.trim() });
      setSubject('');
      setMessage('');
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Message ${recipientName}`}>
      <form onSubmit={handleSend} className="space-y-4">
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="What's this about?"
          required
        />
        <Textarea
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
          rows={5}
          required
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={sending}>Send Message</Button>
        </div>
      </form>
    </Modal>
  );
}
