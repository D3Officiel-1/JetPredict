
'use client';

import { ArrowLeft, Save, Loader2, StickyNote } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function NewNotePage() {
    const [noteContent, setNoteContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    
    const handleSave = () => {
        setIsSaving(true);
        // Simulate saving to a database or local storage
        setTimeout(() => {
            console.log("Note saved:", noteContent);
            toast({
                variant: 'success',
                title: 'Note Sauvegardée',
                description: 'Votre note a été enregistrée.',
            });
            setIsSaving(false);
        }, 1000);
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
             <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#313b5c44,transparent)]"></div>

            <div className="absolute top-4 left-4 z-20">
                <Button asChild variant="ghost">
                <Link href="/predict">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à l'application
                </Link>
                </Button>
            </div>

            <Card className="w-full max-w-2xl z-10 bg-card/70 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><StickyNote />Nouvelle Note</CardTitle>
                    <CardDescription>Créez une nouvelle note rapide. Ceci est un exemple de la fonctionnalité de prise de notes PWA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        placeholder="Écrivez votre note ici..." 
                        className="min-h-[200px]"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                    />
                    <Button onClick={handleSave} disabled={isSaving || !noteContent}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Sauvegarder la note
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

    