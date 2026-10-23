import Account from '@/components/account';
import { googleConfigured } from '@/lib/auth';
import { coverage } from '@/chemistry/generate';
export default function LoginPage(){return <Account coverage={coverage()} googleReady={googleConfigured} welcome/>;}
