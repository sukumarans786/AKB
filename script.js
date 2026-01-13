let tbody=document.querySelector("#itemsTable tbody");

/* ---------- NAV ---------- */

function show(id){
 document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
 document.getElementById(id).classList.add("active");
 if(id=="clients") loadClients();
 if(id=="products") loadProducts();
 if(id=="list") renderInvoices();
 if(id=="dash") loadDashboard();
}

/* ---------- FINANCIAL YEAR INVOICE ---------- */

function generateInvoiceNo(){
 let d=new Date(),y=d.getFullYear(),m=d.getMonth()+1;
 let fy=m<=3?(y-1)+"-"+String(y).slice(2):y+"-"+String(y+1).slice(2);
 let key="AKB_"+fy;
 let n=(localStorage.getItem(key)||0);
 n++;localStorage.setItem(key,n);
 return "AKB-"+String(n).padStart(3,"0")+"/"+fy;
}
invoiceNo.value=generateInvoiceNo();
invoiceDate.valueAsDate=new Date();

/* ---------- CLIENT MASTER ---------- */

function saveClient(){
 let list=JSON.parse(localStorage.getItem("CLIENTS")||"[]");
 list.push({
  name:cName.value,address:cAddress.value,gst:cGST.value,
  phone:cPhone.value,email:cEmail.value
 });
 localStorage.setItem("CLIENTS",JSON.stringify(list));
 loadClients(); fillClientDropdown();
}

function loadClients(){
 let list=JSON.parse(localStorage.getItem("CLIENTS")||"[]");
 clientList.innerHTML="";
 list.forEach(c=>{
  let li=document.createElement("li");
  li.innerText=c.name+" | "+c.phone;
  clientList.appendChild(li);
 });
 fillClientDropdown();
}

function fillClientDropdown(){
 clientSelect.innerHTML="<option value=''>Select Client</option>";
 JSON.parse(localStorage.getItem("CLIENTS")||"[]")
 .forEach((c,i)=>{
  let o=document.createElement("option");
  o.value=i; o.text=c.name;
  clientSelect.appendChild(o);
 });
}

function fillClient(){
 let list=JSON.parse(localStorage.getItem("CLIENTS")||"[]");
 let c=list[clientSelect.value];
 if(!c) return;
 customerName.value=c.name;
 customerAddress.value=c.address;
 customerGST.value=c.gst;
 customerPhone.value=c.phone;
 customerEmail.value=c.email;
}

/* ---------- PRODUCT MASTER ---------- */

function saveProduct(){
 let list=JSON.parse(localStorage.getItem("PRODUCTS")||"[]");
 list.push({name:pName.value,hsn:pHSN.value,uom:pUOM.value,rate:pRate.value});
 localStorage.setItem("PRODUCTS",JSON.stringify(list));
 loadProducts();
}

function loadProducts(){
 let list=JSON.parse(localStorage.getItem("PRODUCTS")||"[]");
 productList.innerHTML="";
 list.forEach(p=>{
  let li=document.createElement("li");
  li.innerText=p.name+" | ₹"+p.rate;
  productList.appendChild(li);
 });
}

/* ---------- ITEMS ---------- */

function addRow(){
 let row=tbody.insertRow();
 row.innerHTML=`
 <td>${tbody.rows.length}</td>
 <td><input list="prodList"></td>
 <td><input></td>
 <td><input></td>
 <td><input type="number" value="1" oninput="calc(this)"></td>
 <td><input type="number" value="0" oninput="calc(this)"></td>
 <td class="total">0</td>
 <td><button onclick="this.closest('tr').remove();calculate()">❌</button></td>`;
}
addRow();

function calc(el){
 let r=el.closest("tr");
 let q=r.cells[4].children[0].value||0;
 let rate=r.cells[5].children[0].value||0;
 r.querySelector(".total").innerText=(q*rate).toFixed(2);
 calculate();
}

function calculate(){
 let sum=0;
 document.querySelectorAll(".total").forEach(t=>sum+=Number(t.innerText||0));
 subtotal.value=sum.toFixed(2);
 let g=sum*(cgstP.value/100)+sum*(sgstP.value/100)+sum*(igstP.value/100);
 grandTotal.value=(sum+g).toFixed(2);
}

/* ---------- SAVE INVOICE ---------- */

function saveInvoice(){
 let list=JSON.parse(localStorage.getItem("INVOICES")||"[]");
 list.push({no:invoiceNo.value, date:invoiceDate.value, total:grandTotal.value});
 localStorage.setItem("INVOICES",JSON.stringify(list));
 generatePDF();
}

/* ---------- DASHBOARD ---------- */

function loadDashboard(){
 let list=JSON.parse(localStorage.getItem("INVOICES")||"[]");
 invoiceCount.innerText="Invoices: "+list.length;
}

/* ---------- INVOICE LIST ---------- */

function renderInvoices(){
 let list=JSON.parse(localStorage.getItem("INVOICES")||"[]");
 invoiceList.innerHTML="";
 list.forEach(i=>{
  let li=document.createElement("li");
  li.innerText=i.no+" — ₹"+i.total;
  invoiceList.appendChild(li);
 });
}

/* ---------- TRANSPORT ---------- */

function toggleTransport(){
 transportBox.style.display=invoiceType.value=="TRANSPORT"?"block":"none";
}
toggleTransport();

/* ---------- PDF ---------- */

function generatePDF(){
 copies.innerHTML="";
 ["ORIGINAL","TRANSPORT COPY","DUPLICATE","EXTRA"].forEach(t=>{
  copies.innerHTML+=buildCopy(t);
 });

 html2pdf().from(invoicePDF).set({
  filename:invoiceNo.value+".pdf",
  jsPDF:{format:"a4"}
 }).save();
}

function buildCopy(type){
 let rows="";
 document.querySelectorAll("#itemsTable tbody tr").forEach((r,i)=>{
  rows+=`<tr><td>${i+1}</td><td>${r.cells[1].children[0].value}</td>
  <td>${r.cells[2].children[0].value}</td><td>${r.cells[3].children[0].value}</td>
  <td>${r.cells[4].children[0].value}</td><td>${r.cells[5].children[0].value}</td>
  <td>${r.cells[6].innerText}</td></tr>`;
 });

 return `
 <div class="copy">
 <h3 style="text-align:center">GST TAX INVOICE - ${type}</h3>
 <p><b>A.K.B ENTERPRISES</b><br>No 3C, LF Road, Ranipet - 632401<br>GSTIN: 33AMKPB3465ZN</p>

 <p><b>Invoice No:</b> ${invoiceNo.value} | <b>Date:</b> ${invoiceDate.value}</p>

 <p><b>Details of Receiver / Billed to</b><br>
 ${customerName.value}<br>${customerAddress.value}<br>
 GSTIN: ${customerGST.value}<br>
 Phone: ${customerPhone.value} | Email: ${customerEmail.value}</p>

 <table>
 <tr><th>Sl</th><th>Product</th><th>HSN</th><th>UOM</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
 ${rows}
 </table>

 <h3>Grand Total: ₹${grandTotal.value}</h3>

 <p><b>Bank:</b> FEDERAL BANK | A/c: 18335500000724 | IFSC: FDRL0001833</p>

 <p>This is a computer-generated invoice</p>
 </div>`;
}
