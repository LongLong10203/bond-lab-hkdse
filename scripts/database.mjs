import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const directory=resolve('.postgres/data');mkdirSync(resolve('.postgres/socket'),{recursive:true});
const pg=new EmbeddedPostgres({databaseDir:directory,user:'bondlab',password:'bondlab',port:54329,persistent:true,authMethod:'scram-sha-256',postgresFlags:['-h','127.0.0.1','-k',resolve('.postgres/socket')],onLog:()=>{},onError:(message)=>{if(String(message).includes('FATAL'))console.error(String(message));}});
try {
  if(!existsSync(resolve(directory,'PG_VERSION')))await pg.initialise();
  await pg.start();
  const client=pg.getPgClient();await client.connect();
  const found=await client.query("SELECT 1 FROM pg_database WHERE datname = 'bondlab'");
  if(!found.rowCount)await client.query('CREATE DATABASE bondlab');await client.end();
  console.log('Bond Lab PostgreSQL is ready on 127.0.0.1:54329. Keep this terminal open.');
  let closing=false;const close=async()=>{if(closing)return;closing=true;await pg.stop();process.exit(0);};
  process.on('SIGINT',close);process.on('SIGTERM',close);
  setInterval(()=>{},60000);
}catch(error){console.error('Could not start PostgreSQL:',error?.message??error??'The server could not start. Check port 54329 and local process permissions.');process.exit(1);}
