import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowRight, ImagePlus, Mic2, Upload, Video, X } from 'lucide-react'
import { roleLabel, type CommunityPost, type PostKind, type Profile, type Role } from '../data'
import { saveMedia } from '../mediaStore'

export function PostComposer({ author, role, onClose, onCreate }: { author: Profile; role: Role; onClose: () => void; onCreate: (post: CommunityPost) => void }) {
  const [kind,setKind]=useState<PostKind>('reel')
  const [caption,setCaption]=useState('')
  const [hashtagsInput,setHashtagsInput]=useState('')
  const [craft,setCraft]=useState('')
  const [location,setLocation]=useState('')
  const [evidence,setEvidence]=useState('')
  const [claimType,setClaimType]=useState<'community'|'heritage'>('community')
  const [mediaUrl,setMediaUrl]=useState('')
  const [filename,setFilename]=useState('')
  const [file,setFile]=useState<File|null>(null)
  const [error,setError]=useState('')
  const accept=kind==='audio'?'audio/*':kind==='story'?'image/*,video/*':kind==='photo'?'image/*':'video/*'
  const mediaType: 'image'|'video'|'audio' = file?.type.startsWith('audio/')?'audio':file?.type.startsWith('video/')?'video':'image'
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setError('')
    if(!file){setError('Choose a photo, video or audio recording first.');return}
    if(claimType==='heritage'&&!evidence.trim()){setError('Add a source, local context or evidence note so eligible reviewers can assess this claim.');return}
    const hashtags=[...new Set(hashtagsInput.split(/[\s,]+/).map(tag=>tag.trim()).filter(Boolean).map(tag=>tag.startsWith('#')?tag:'#'+tag).slice(0,10))]
    const id='post-'+Date.now();const mediaKey='media-'+id
    try{await saveMedia(file,mediaKey)}catch{setError('This browser could not save the media. Check available storage and try a smaller file.');return}
    onCreate({id,kind,mediaType,mediaKey,caption:caption.trim(),craft:craft.trim()||'Living heritage',location:location.trim()||'Place not specified',mediaUrl,filename,authorId:author.id,hashtags,createdAt:new Date().toISOString(),claimType,evidence:evidence.trim()||undefined,verificationStatus:claimType==='heritage'?'pending':'not-required'})
  }
  const kinds:PostKind[]=['reel','story','photo','audio','video']
  return <ComposerFrame title="Share a story from where you are." eyebrow="ASTITVA · COMMUNITY STORIES" onClose={onClose}>
    <form onSubmit={event=>{void submit(event)}} className="space-y-4 px-5 py-5 sm:px-7">
      <div className="rounded-xl bg-[#f6efdf] p-3 text-sm">Posting as <b>{author.name}</b> · {roleLabel(role)}</div>
      <div><p className="mb-2 text-sm font-semibold">What would you like to share?</p><div className="flex flex-wrap gap-2" role="group" aria-label="Choose post format">{kinds.map(type=><button type="button" key={type} aria-pressed={kind===type} onClick={()=>{setKind(type);setMediaUrl('');setFilename('');setFile(null)}} className={`rounded-full px-4 py-2.5 text-sm font-semibold capitalize ${kind===type?'bg-indigo text-white':'border border-[#e2d9c9] bg-white text-[#736b60]'}`}>{type==='reel'?<><Video size={14}/> Reel</>:type==='story'?'Story':type==='photo'?<><ImagePlus size={14}/> Photo</>:type==='audio'?<><Mic2 size={14}/> Audio</>:'Video'}</button>)}</div></div>
      <label className="flex min-h-[165px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#c9b99e] bg-[#f4efe4] text-center">{mediaUrl?(mediaType==='audio'?<audio src={mediaUrl} controls/>:mediaType==='video'?<video src={mediaUrl} controls className="max-h-[220px] w-full object-contain"/>:<img src={mediaUrl} alt="Story upload preview" className="max-h-[220px] w-full object-cover"/>):<><span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#e6decd] text-indigo"><Upload size={17}/></span><span className="text-sm font-semibold">Choose {kind==='audio'?'an audio recording':kind==='photo'?'a photograph':kind==='story'?'a photo or short video':'a video'}</span><span className="mt-1 px-3 text-xs text-[#8c8071]">Your original media is stored in this browser for the demo.</span></>}<input type="file" accept={accept} required className="sr-only" onChange={event=>{const selected=event.target.files?.[0];if(selected){setFile(selected);setMediaUrl(URL.createObjectURL(selected));setFilename(selected.name);setError('')}}}/></label>
      {filename&&<p className="truncate text-xs text-[#82786c]">Selected: {filename}</p>}
      <Field label="Description" hint="Tell people what they are hearing or seeing, who shared it, and why it matters."><textarea required rows={3} value={caption} onChange={event=>setCaption(event.target.value)} placeholder="The first sound is the shuttle crossing the loom…" className="form-control resize-y"/></Field>
      <Field label="Hashtags" hint="Separate tags with spaces or commas, for example #Ajrakh #Kutch #LivingHeritage."><input value={hashtagsInput} onChange={event=>setHashtagsInput(event.target.value)} placeholder="#Craft #Place #Tradition" className="form-control"/></Field>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Craft or tradition"><input value={craft} onChange={event=>setCraft(event.target.value)} placeholder="e.g. Kutch handloom" className="form-control"/></Field><Field label="Place"><input value={location} onChange={event=>setLocation(event.target.value)} placeholder="Village, district, state" className="form-control"/></Field></div>
      <fieldset className="rounded-2xl border border-[#e5dcc9] p-4"><legend className="px-1 text-sm font-bold">Is this a heritage claim?</legend><div className="flex flex-wrap gap-2"><button type="button" aria-pressed={claimType==='community'} onClick={()=>setClaimType('community')} className={`rounded-full px-4 py-2 text-sm ${claimType==='community'?'bg-olive text-white':'border bg-white'}`}>Community story</button><button type="button" aria-pressed={claimType==='heritage'} onClick={()=>setClaimType('heritage')} className={`rounded-full px-4 py-2 text-sm ${claimType==='heritage'?'bg-indigo text-white':'border bg-white'}`}>Heritage claim · request review</button></div><p className="mt-2 text-xs leading-5 text-[#766c60]">Everyday stories publish right away. Heritage claims stay labelled as pending until two eligible, community-verified reviewers vote.</p>{claimType==='heritage'&&<Field label="Evidence or local context" hint="Add your source, community context or how the claim was documented."><textarea required rows={3} value={evidence} onChange={event=>setEvidence(event.target.value)} placeholder="Shared by the maker in Kutchi; recorded with consent on 12 September…" className="form-control resize-y"/></Field>}</fieldset>
      {error&&<p role="alert" className="rounded-xl bg-[#fae7df] p-3 text-sm text-[#8f3328]">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9e1d4] pt-4"><p className="text-xs text-[#756b5e]">Stories are public in this demo. Add permission and attribution before sharing someone else’s recording.</p><div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-full border border-[#ded4c4] px-4 py-2.5 text-sm font-semibold text-[#746b61]">Cancel</button><button type="submit" className="rounded-full bg-rust px-5 py-2.5 text-sm font-semibold text-white">Publish {kind} <ArrowRight size={14} className="ml-1 inline"/></button></div></div>
    </form>
  </ComposerFrame>
}

function ComposerFrame({ title, eyebrow, onClose, children }: { title:string; eyebrow:string; onClose:()=>void; children:ReactNode }) { return <div className="sari-composer-overlay fixed inset-0 z-[70] flex items-center justify-center p-3 backdrop-blur-sm sm:p-6" onClick={onClose}><section role="dialog" aria-modal="true" aria-labelledby="post-composer-title" onClick={event=>event.stopPropagation()} className="sari-composer-panel max-h-[94vh] w-full max-w-[760px] overflow-y-auto rounded-[24px]"><div className="woven-rule"/><div className="sari-composer-header flex items-start justify-between px-5 py-4 sm:px-7"><div><p className="craft-overline text-xs">{eyebrow}</p><h2 id="post-composer-title" className="mt-1 font-serif text-2xl">{title}</h2></div><button type="button" onClick={onClose} aria-label="Close post composer" className="sari-composer-close rounded-full p-2"><X size={18}/></button></div>{children}</section></div> }
function Field({label,hint,children}:{label:string;hint?:string;children:ReactNode}) { return <label className="block"><span className="block text-sm font-bold text-[#4b4d60]">{label}</span>{hint&&<span className="mt-0.5 block text-xs leading-5 text-[#8d8274]">{hint}</span>}<div className="mt-1.5">{children}</div></label> }
