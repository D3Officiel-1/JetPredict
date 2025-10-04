
'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function OpenFilePage() {
    const [fileContent, setFileContent] = useState('');
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if ('launchQueue' in window && window.launchQueue) {
            window.launchQueue.setConsumer(async (launchParams) => {
                if (!launchParams.files || launchParams.files.length === 0) {
                    setIsLoading(false);
                    return;
                }
                
                const fileHandle = launchParams.files[0];
                const file = await fileHandle.getFile();
                const contents = await file.text();

                setFileName(file.name);
                setFileContent(contents);
                setIsLoading(false);
            });
        } else {
             setIsLoading(false);
        }
    }, []);

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
                    <CardTitle className="flex items-center gap-2"><FileText />Gestionnaire de Fichiers</CardTitle>
                    <CardDescription>Contenu du fichier ouvert via la PWA.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">En attente d'un fichier...</p>
                        </div>
                    ) : fileName ? (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Fichier : <span className="font-normal text-primary">{fileName}</span></h3>
                            <pre className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap max-h-96 overflow-auto">
                                {fileContent}
                            </pre>
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-48 gap-2">
                             <p className="text-muted-foreground">Aucun fichier n'a été fourni au lancement.</p>
                             <p className="text-sm text-center text-muted-foreground/80">Pour tester, faites un clic droit sur un fichier `.txt` et choisissez "Ouvrir avec Jet Predict".</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
