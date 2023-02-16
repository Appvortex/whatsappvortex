import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  BeforeCreate,
  BeforeUpdate,
  PrimaryKey,
  AutoIncrement,
  Default,
  HasMany,
  BelongsToMany,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import { compare, hash } from "bcryptjs";

@Table
class Company extends Model<Company> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column
  email: string;

  @Column
  passwordDefault: string;

  @Column
  numberAttendants: string;

  @Column
  numberConections: number;

  @Column
  status: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BeforeUpdate
  @BeforeCreate
  static hashPassword = async (instance: Company): Promise<void> => {
    var has = await hash(instance.passwordDefault, 8);
    console.info('Oiiii', has)
    if (instance.passwordDefault) {
      instance.passwordDefault = has;
    }
  };

  public checkPassword = async (password: string): Promise<boolean> => {
    return compare(password, this.getDataValue("passwordDefault"));
  };
}

export default Company;
