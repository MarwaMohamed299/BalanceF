import { TestBed } from '@angular/core/testing';

import { BalancefService } from './balancef.service';

describe('BalancefService', () => {
  let service: BalancefService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BalancefService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
