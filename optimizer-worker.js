self.window=self;
importScripts('data/game-data.js','optimizer-engine.js');
self.onmessage=event=>{
  try{
    const {inventory,config}=event.data,search=HSR_OPT.createSearch(inventory,config,HSR_DATA);
    function step(){try{const state=search.step(500);self.postMessage(state);if(!state.done)setTimeout(step,0);}catch(error){self.postMessage({error:error.message});}}
    step();
  }catch(error){self.postMessage({error:error.message});}
};
