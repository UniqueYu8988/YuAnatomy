"""Read original OBJ triangles without simplification; preserve split vertex normals."""
from array import array
def read_obj(path):
    positions=[]; normals=[]; faces=[]
    for line in path.read_text(encoding='utf-8').splitlines():
        if line.startswith('v '):
            x,y,z=map(float,line.split()[1:4])
            positions.append((x*.001,z*.001+.0781112-1.30,-y*.001-.1))
        elif line.startswith('vn '):
            x,y,z=map(float,line.split()[1:4])
            normals.append((x,z,-y))
        elif line.startswith('f '):
            face=[]
            for item in line.split()[1:]:
                tokens=item.split('/')
                vi=int(tokens[0]); ni=int(tokens[2]) if len(tokens)>2 and tokens[2] else vi
                vi=vi-1 if vi>0 else len(positions)+vi
                ni=ni-1 if ni>0 else len(normals)+ni
                face.append((vi,ni))
            for i in range(1,len(face)-1):faces.extend((face[0],face[i],face[i+1]))
    assert positions and normals and faces,path
    output_positions=array('f'); output_normals=array('h'); indices=array('I'); mapping={}
    for pair in faces:
        if pair not in mapping:
            vi,ni=pair
            assert 0<=vi<len(positions) and 0<=ni<len(normals),path
            mapping[pair]=len(mapping)
            output_positions.extend(positions[vi])
            output_normals.extend(max(-32767,min(32767,round(v*32767))) for v in normals[ni])
        indices.append(mapping[pair])
    bounds=[[min(output_positions[i::3]) for i in range(3)],[max(output_positions[i::3]) for i in range(3)]]
    return output_positions,output_normals,indices,bounds
