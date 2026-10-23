import { z } from 'zod';
export const moleculeSchema=z.object({
  atoms:z.array(z.object({id:z.string().min(1).max(40),element:z.enum(['C','H','O','N','F','Cl','Br','I','*']),x:z.number().finite().min(-2000).max(4000),y:z.number().finite().min(-2000).max(4000),charge:z.number().int().min(-1).max(1).optional()})).max(80),
  bonds:z.array(z.object({a:z.string().max(40),b:z.string().max(40),order:z.union([z.literal(1),z.literal(2),z.literal(3)])})).max(100),
  autoH:z.boolean().optional(),polymer:z.boolean().optional(),
});
export const submissionSchema=z.object({requestId:z.string().uuid().optional(),id:z.string().min(1).max(40),reveal:z.boolean().optional(),answer:z.object({molecule:moleculeSchema.optional(),conditions:z.array(z.string().max(40)).max(20).optional(),steps:z.array(z.object({molecule:moleculeSchema,conditions:z.array(z.string().max(40)).max(20)})).max(4).optional()}).optional()});
export async function readJson(request:Request,maxBytes=65000){
  const reader=request.body?.getReader();if(!reader)throw new Error('Missing request body');
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new Error('Request too large');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
