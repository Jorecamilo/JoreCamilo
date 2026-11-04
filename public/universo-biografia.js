const button=document.getElementById('biografia-trigger');
const field=document.getElementById('pieza-campo');
const bio=document.createElement('section');
bio.id='universo-biografia';bio.className='universo-biografia';bio.hidden=true;bio.setAttribute('aria-label','Biografía');
const paragraphs=[
  'Jorge Camilo Peña Cantillo aterrizó en Pivijay (Magdalena), tierra de la oniromancia Ette Ennaka, a las 11 a. m. del 10 de septiembre de 1995, hijo del acordeonero Ramiro Peña y la seño Milagro Cantillo.',
  'con su hacer pretende no dejar cicatrizar la llaga del cielo por la que ambrosía chorrea, y ojalá se le unan colegas.'
];
paragraphs.forEach((text,index)=>{const paragraph=document.createElement('p');paragraph.textContent=text;paragraph.style.margin=index?'1em 0 0':'0';bio.append(paragraph);});
const question=document.createElement('button');
question.type='button';question.className='biografia-pregunta';
question.textContent='¿por qué JoreCamilo?';
question.setAttribute('aria-expanded','false');question.setAttribute('aria-controls','biografia-nombre');
const explanation=document.createElement('div');
explanation.id='biografia-nombre';explanation.hidden=true;
[
  'Un pivijayero común, al pronunciar Jorge Camilo, siente como si tuviera un policía acostado en la lengua. Un policía español acostado en la lengua.',
  'Por eso, al igual que los pájaros de tierra alta trinan agudo y los pájaros de playa cantan caliente, por allá JoreCamilo se dice de corrido'
].forEach(text=>{const paragraph=document.createElement('p');paragraph.textContent=text;paragraph.style.margin='1em 0 0';explanation.append(paragraph);});
question.addEventListener('click',()=>{const open=question.getAttribute('aria-expanded')!=='true';question.setAttribute('aria-expanded',String(open));explanation.hidden=!open;});
bio.append(question,explanation);
field.append(bio);
function toggle(open){button.setAttribute('aria-expanded',String(open));bio.hidden=!open;field.dataset.biografia=String(open);if(open){window.dispatchEvent(new Event('universo:biografia'));field.setAttribute('aria-hidden','false');}}
button.addEventListener('click',()=>toggle(button.getAttribute('aria-expanded')!=='true'));
for(const control of document.querySelectorAll('.categoria-trigger,#oximoron-trigger'))control.addEventListener('click',()=>toggle(false));
