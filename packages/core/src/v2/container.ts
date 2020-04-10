import { Accessor, ElementGraph, Material, Mesh, Node, Primitive, Root, Scene, Texture } from "../elements/index";

export class Container {
  private graph: ElementGraph = new ElementGraph();
  private root: Root = new Root(this.graph);

  public getRoot(): Root {
    return this.root;
  }

  public clone(): Container {
    throw new Error('Not implemented.');
  }

  /* Element factory methods. */

  createScene(name: string): Scene {
    const scene = new Scene(this.graph, name);
    this.root.addScene(scene);
    return scene;
  }
  createNode(name: string): Node {
    const node = new Node(this.graph, name);
    this.root.addNode(node);
    return node;
  }
  createMesh(name: string): Mesh {
    const mesh = new Mesh(this.graph, name);
    this.root.addMesh(mesh);
    return mesh;
  }
  // TODO(donmccurdy): Move this to mesh.createPrimitive()?
  createPrimitive(/*name: string*/): Primitive {
    const primitive = new Primitive(this.graph/*, name*/);
    // this.root.addPrimitive(primitive);
    return primitive;
  }
  createMaterial(name: string): Material {
    const material = new Material(this.graph, name);
    this.root.addMaterial(material);
    return material;
  }
  createTexture(name: string): Texture {
    const texture = new Texture(this.graph, name);
    this.root.addTexture(texture);
    return texture;
  }
  createAccessor(name: string): Accessor {
    const accessor = new Accessor(this.graph, name);
    this.root.addAccessor(accessor);
    return accessor;
  }
  // TODO(donmccurdy): Add container.createBuffer()?
  // TODO(donmccurdy): Add container.createBufferView(buffer)?
}