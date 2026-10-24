import Account from '@/components/account';
export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <Account coverage={{variants:0,rules:0}} googleReady view="leaderboard" profileId={id}/>;
}
