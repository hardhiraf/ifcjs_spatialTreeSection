import { Color, MeshBasicMaterial } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { IfcManager } from "web-ifc-viewer/dist/components";
import { IfcSelector } from "web-ifc-viewer/dist/components/ifc/selection/selector";

const container = document.getElementById("viewer-container");
const viewer = new IfcViewerAPI({
  container,
  backgroundColor: new Color("white"),
});

viewer.axes.setAxes();
viewer.grid.setGrid();
viewer.IFC.setWasmPath("wasm/");

const pickMat = new MeshBasicMaterial({
  color: 0x3d7af5,
  transparent: true,
  opacity: 0.7,
});

const prePickMat = new MeshBasicMaterial({
  color: 0xb1fc03,
  transparent: true,
  opacity: 0.7,
});

viewer.IFC.selector.preselection.material = prePickMat;
viewer.IFC.selector.selection.material = pickMat;

loadIfc("ifc_models/01.ifc");

async function loadIfc(url) {
  const model = await viewer.IFC.loadIfcUrl(url);
  await viewer.shadowDropper.renderShadow(model.modelID);
  viewer.context.renderer.postProduction.active = true;

  const project = await viewer.IFC.getSpatialStructure(model.modelID);
  console.log(project);
  createTreeMenu(project);
}

// Tree view

const toggler = document.getElementsByClassName("caret");
for (let i = 0; i < toggler.length; i++) {
  toggler[i].onclick = () => {
    toggler[i].parentElement
      .querySelector(".nested")
      .classList.toggle("active");
    toggler[i].classList.toggle("caret-down");
  };
}

// Spatial tree menu

function createTreeMenu(ifcProject) {
  const root = document.getElementById("tree-root");
  removeAllChildren(root);
  const ifcProjectNode = createNestedChild(root, ifcProject);
  ifcProject.children.forEach((child) => {
    constructTreeMenuNode(ifcProjectNode, child);
  });
}

function nodeToString(node) {
  return `${node.type} - ${node.expressID}`;
}

function constructTreeMenuNode(parent, node) {
  const children = node.children;
  if (children.length === 0) {
    createSimpleChild(parent, node);
    return;
  }
  const nodeElement = createNestedChild(parent, node);
  children.forEach((child) => {
    constructTreeMenuNode(nodeElement, child);
  });
}

function createNestedChild(parent, node) {
  const content = nodeToString(node);
  const root = document.createElement("li");
  createTitle(root, content);
  const childrenContainer = document.createElement("ul");
  childrenContainer.classList.add("nested");
  root.appendChild(childrenContainer);
  parent.appendChild(root);
  return childrenContainer;
}

function createTitle(parent, content) {
  const title = document.createElement("span");
  title.classList.add("caret");
  title.onclick = () => {
    title.parentElement.querySelector(".nested").classList.toggle("active");
    title.classList.toggle("caret-down");
  };
  title.textContent = content;
  parent.appendChild(title);
}

function createSimpleChild(parent, node) {
  const content = nodeToString(node);
  const childNode = document.createElement("li");
  childNode.classList.add("leaf-node");
  childNode.textContent = content;
  parent.appendChild(childNode);

  childNode.onmousemove = () => {
    viewer.IFC.selector.prepickIfcItemsByID(0, [node.expressID]);
  };

  childNode.onclick = () => {
    viewer.IFC.selector.pickIfcItemsByID(0, [node.expressID]);
  };
}

function removeAllChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

container.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
container.ondblclick = () => viewer.IFC.selector.unpickIfcItems();
container.onclick = () => viewer.IFC.selector.pickIfcItem();
