import { buildPrompts } from './lib/runway.ts';
const p = { name:'LODGEFLIX', style:'prestige', treatment:'minimal',
            primaryColor:'#E50914', duration:4 };
const veo  = buildPrompts({ ...p, videoModel:'veo3.1_fast' });
const orig = buildPrompts({ ...p, videoModel:'gen4_turbo'  });
console.log('===FACE(styleMotionVeo)===\n'+veo.videoPrompt);
console.log('\n===ORIGINAL(styleMotion)===\n'+orig.videoPrompt);
console.log('\nidentical image prompt: '+(veo.imagePrompt===orig.imagePrompt));
