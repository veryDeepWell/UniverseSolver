self.window=self;
importScripts('data/game-data.js','equipment-effects.js','team-engine.js');
self.onmessage=event=>{
  try{const {core,pool,profiles,scenario}=event.data,search=HSR_TEAM.createSearch(core,pool,profiles,scenario,HSR_DATA);
    function step(){try{const progress=search.step(2);self.postMessage(progress);if(!progress.done)setTimeout(step,0);}catch(error){self.postMessage({error:error.message});}}step();
  }catch(error){self.postMessage({error:error.message});}
};
