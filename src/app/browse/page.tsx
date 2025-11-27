import { getSession } from '@/lib/auth';
import BrowseClient from '@/components/browse/BrowseClient';

export default async function BrowsePage() {
    const session = await getSession();
    const isLoggedIn = !!session;

    return <BrowseClient isLoggedIn={isLoggedIn} />;
}