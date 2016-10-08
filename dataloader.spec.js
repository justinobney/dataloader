import Loader from '../src/loader.js';
import { Promise } from 'es6-promise';

describe('Loader', () => {
  jasmine.clock().install();

  beforeEach(function () {
    spyOn(obj, 'getData').and.callThrough();
  });

  afterEach(() => {
    jasmine.clock().tick(5);
  })

  it('debounces the call', () => {
    const loader = new Loader(keys => obj.getData(keys));
    loader.load(1);
    expect(obj.getData).not.toHaveBeenCalledWith([1]);
    jasmine.clock().tick(5);
    expect(obj.getData).toHaveBeenCalledWith([1]);
  });

  it('collects the arguments', () => {
    const loader = new Loader(keys => obj.getData(keys));
    loader.load(1);
    loader.load(2);
    expect(obj.getData).not.toHaveBeenCalledWith([1,2]);
    jasmine.clock().tick(5);
    expect(obj.getData).toHaveBeenCalledWith([1,2]);
    expect(obj.getData.calls.count()).toEqual(1);
  });

  it('can set max batch limit', () => {
    const loader = new Loader(
      keys => obj.getData(keys),
      {limit:2}
    );
    loader.load(1);
    loader.load(2);
    loader.load(3);

    expect(obj.getData).toHaveBeenCalledWith([1,2]);
    expect(obj.getData).not.toHaveBeenCalledWith([3]);
    expect(obj.getData.calls.count()).toEqual(1);

    jasmine.clock().tick(5);
    expect(obj.getData).toHaveBeenCalledWith([3]);
    expect(obj.getData.calls.count()).toEqual(2);
  });

  it('can force execution', () => {
    const loader = new Loader(
      keys => obj.getData(keys));
    loader.load(1);
    loader.load(2);
    loader.flush();

    expect(obj.getData).toHaveBeenCalledWith([1,2]);
    expect(obj.getData.calls.count()).toEqual(1);
  });

  it('can clear cache', () => {
    const loader = new Loader(
      keys => obj.getData(keys)
    );

    loader.load(1);
    jasmine.clock().tick(5);
    expect(obj.getData.calls.count()).toEqual(1);

    loader.clear(1);
    loader.load(1);
    jasmine.clock().tick(5);
    expect(obj.getData.calls.count()).toEqual(2);
  });

  it('can clear all', () => {
    const loader = new Loader(
      keys => obj.getData(keys)
    );

    loader.load(1);
    jasmine.clock().tick(5);
    expect(obj.getData.calls.count()).toEqual(1);

    loader.load(2);
    jasmine.clock().tick(5);
    expect(obj.getData.calls.count()).toEqual(2);

    loader.clear();
    loader.load(1);
    loader.load(2);
    jasmine.clock().tick(5);
    expect(obj.getData.calls.count()).toEqual(3);
    expect(obj.getData).toHaveBeenCalledWith([1,2]);
  });

  it('does not duplicate keys', () => {
    const loader = new Loader(keys => obj.getData(keys));
    loader.load(1);
    loader.load(1);
    jasmine.clock().tick(5);
    expect(obj.getData).toHaveBeenCalledWith([1]);
  });

  it('returns a promise', () => {
    const loader = new Loader(keys => obj.getData(keys));
    const promise = loader.load(1);
    expect(promise.then).toBeDefined();
  });

  it('maps keys to promises', () => {
    const loader = new Loader(keys => obj.getData(keys));
    const promiseA = loader.load(1);
    const promiseB = loader.load(1);
    expect(promiseA).toEqual(promiseB);
  });

  it('returned promises should resolve with individual items', (done) => {
    const loader = new Loader(keys => obj.getData(keys));

    const promiseA = loader.load(2).then(resp => {
      expect(obj.getData).toHaveBeenCalledWith([2,1]);
      expect(obj.getData.calls.count()).toBe(1);
      expect(resp.id).toEqual(2);
    });

    const promiseB = loader.load(1).then(resp => {
      expect(obj.getData).toHaveBeenCalledWith([2,1]);
      expect(obj.getData.calls.count()).toBe(1);
      expect(resp.id).toEqual(1);
    });

    jasmine.clock().tick(5);

    Promise.all([promiseA, promiseB]).then(() => {
      done();
    });
  });
});

const obj = {
  getData(keys) {
    return Promise.resolve(
      keys.map(
        x => ({
          id:x,
          prop: `foo prop ${x}`
        })
      )
    );
  }
}
