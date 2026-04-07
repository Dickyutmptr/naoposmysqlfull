import './globals.css'
import './padel-theme.css'

export const metadata = {
    title: 'Nao POS',
    description: 'Point of Sale System',
}

export default function RootLayout({ children }) {
    return (
        <html lang="id">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body>{children}</body>
        </html>
    )
}
