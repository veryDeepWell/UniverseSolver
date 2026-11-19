const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('../phenomena');const P=HSR_PHENOMENA;
const text='Крит. шанс 50%, крит. урон 160%, скорость 134, Юмор 60, зона и щит, SP 3.';
const tokens=P.tokenize(text);
assert.equal(tokens.map(t=>t.text).join(''),text);
assert.deepEqual(tokens.filter(t=>t.key).map(t=>t.key),['crit','critDamage','speed','humor','zone','shield','sp']);
assert.ok(!P.tokenize('SPARKLE, mySPD, защита_ключ').some(t=>t.key));
assert.match(P.mark('hp','<img src=x onerror=alert(1)>'),/&lt;img/);
assert.ok(!P.mark('hp','<img>').includes('<img>'));
assert.equal(P.tokenize('Крит. урон')[0].key,'critDamage');
const css=fs.readFileSync('planner.css','utf8'),html=fs.readFileSync('index.html','utf8');
for(const [,tone]of Object.values(P.symbols))assert.ok(css.includes('.mark-'+tone));
assert.ok(html.indexOf('src="phenomena.js"')<html.indexOf('src="planner.js"'));
// Minimal DOM fixture exercises node replacement, exclusions, dynamic updates
// and idempotence without a network-installed browser dependency.
class Node{
  constructor(type,doc,tag='',value=''){this.nodeType=type;this.ownerDocument=doc;this.tagName=tag;this.nodeValue=value;this.childNodes=[];this.className='';this.dataset={};this.attributes={};}
  get parentElement(){return this.parentNode?.nodeType===1?this.parentNode:null;}
  append(...nodes){for(let node of nodes){if(typeof node==='string')node=this.ownerDocument.createTextNode(node);node.parentNode=this;this.childNodes.push(node);}}
  setAttribute(key,value){this.attributes[key]=value;}
  set textContent(value){this.childNodes=[];this.append(String(value));}
  get textContent(){return this.nodeType===3?this.nodeValue:this.childNodes.map(node=>node.textContent).join('');}
  closest(){for(let n=this;n;n=n.parentElement)if(['script','style','textarea','input','select','option','svg','code','pre'].includes(n.tagName)||n.className.split(' ').includes('plan-mark')||n.attributes.contenteditable==='true'||n.attributes['data-no-phenomena']!==undefined)return n;return null;}
  replaceWith(node){const parent=this.parentNode;node.parentNode=parent;parent.childNodes.splice(parent.childNodes.indexOf(this),1,node);this.parentNode=null;}
}
const doc={readyState:'complete',createElement(tag){return new Node(1,this,tag);},createTextNode(text){return new Node(3,this,'',text);},createTreeWalker(root){const texts=[];const visit=n=>{for(const child of n.childNodes){if(child.nodeType===3)texts.push(child);else visit(child);}};visit(root);let i=0;return {nextNode:()=>texts[i++]||null};}};
doc.body=doc.createElement('body');
const label=doc.createElement('label'),input=doc.createElement('input');input.value='134';input.onchange=()=>42;
label.append(doc.createTextNode('Скорость, SPD'),input);doc.body.append(label);
const code=doc.createElement('pre');code.textContent='Крит. шанс 50%';doc.body.append(code);
let notify;const context={document:doc,MutationObserver:class{constructor(callback){notify=callback;}observe(){}}};context.window=context;
vm.runInNewContext(fs.readFileSync('phenomena.js','utf8'),context);
assert.equal(label.childNodes.length,2,'Label text stays one grid item');
assert.equal(label.childNodes[1],input);assert.equal(input.value,'134');assert.equal(input.onchange(),42);
assert.equal(code.childNodes[0].nodeType,3,'Preformatted replay stays raw');
const before=label.textContent;context.HSR_PHENOMENA.decorate(label);assert.equal(label.textContent,before,'No repeated icons');
const dynamic=doc.createElement('p');dynamic.textContent='Зона: крит. урон';doc.body.append(dynamic);
notify([{type:'childList',addedNodes:[dynamic]}]);
assert.ok(dynamic.textContent.includes('◉'));assert.ok(dynamic.textContent.includes('✷'));
console.log('Verified semantic tokens, escaping, styles/script wiring, dynamic decoration, idempotence and preserved form/replay nodes.');
