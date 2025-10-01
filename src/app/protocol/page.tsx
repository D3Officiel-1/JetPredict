
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Link as LinkIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function ProtocolContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get('url');

    return (
        <Card className="w-full max-w-2xl z-10 bg-card/70 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LinkIcon />Gestionnaire de Protocole</CardTitle>
                <CardDescription>Votre application a été ouverte via un protocole personnalisé.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {url ? (
                    <div className="space-y-1">
                        <h3 className="font-semibold">URL reçue :</h3>
                        <p className="bg-muted p-3 rounded-md text-sm break-all">{decodeURIComponent(url)}</p>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">Aucune information n'a été reçue via le protocole.</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function ProtocolPage() {
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
                <ProtocolContent />
            </Suspense>
        </div>
    );
}

    