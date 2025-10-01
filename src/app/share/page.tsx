
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Share2, Link as LinkIcon, Text, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function ShareContent() {
    const searchParams = useSearchParams();
    const title = searchParams.get('title');
    const text = searchParams.get('text');
    const url = searchParams.get('url');

    return (
        <Card className="w-full max-w-2xl z-10 bg-card/70 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Share2 />Contenu Partagé</CardTitle>
                <CardDescription>Voici les informations reçues via le partage de l'OS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {title && (
                    <div className="space-y-1">
                        <h3 className="font-semibold flex items-center gap-2 text-primary"><Text size={18}/> Titre</h3>
                        <p className="bg-muted p-3 rounded-md text-sm">{title}</p>
                    </div>
                )}
                 {text && (
                    <div className="space-y-1">
                        <h3 className="font-semibold flex items-center gap-2 text-primary"><Text size={18}/> Texte</h3>
                        <p className="bg-muted p-3 rounded-md text-sm">{text}</p>
                    </div>
                )}
                 {url && (
                    <div className="space-y-1">
                        <h3 className="font-semibold flex items-center gap-2 text-primary"><LinkIcon size={18}/> URL</h3>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="bg-muted p-3 rounded-md text-sm block truncate text-blue-400 hover:underline">{url}</a>
                    </div>
                )}
                {!title && !text && !url && (
                    <p className="text-muted-foreground text-center py-8">Aucun contenu n'a été partagé.</p>
                )}
            </CardContent>
        </Card>
    );
}


export default function SharePage() {
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

            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary"/>}>
                <ShareContent />
            </Suspense>
        </div>
    );
}

    