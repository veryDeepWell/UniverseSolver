self.window=self;
importScripts('data/game-data.js','equipment-effects.js','team-engine.js','set-engine.js');
self.onmessage=event=>{try{const search=HSR_SETS.createSearch(event.data,HSR_DATA);function step(){try{const progress=search.step(3);self.postMessage(progress);if(!progress.done)setTimeout(step,0);}catch(error){self.postMessage({error:error.message});}}step();}catch(error){self.postMessage({error:error.message});}};
